import { base58 } from '@scure/base'

import { streamEncrypt, streamDecrypt, parseStreamHeader } from '@/lib/crypto-stream'

// Interface for worker input
interface WorkerInput {
  mode: 'encrypt' | 'decrypt'
  encryptionMode: 'pubk' | 'pwd'
  file: File
  filename: string
  publicKey?: string // For pubk encryption
  privateKey?: string // For pubk decryption
  password?: string // For pwd encryption/decryption
  isTextMode: boolean
}

// Clamp progress value between 0 and 100
const clampProgress = (progress: number): number => Math.min(Math.max(progress, 0), 100)

// Handle messages in the worker
self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { mode, encryptionMode, file, filename, publicKey, privateKey, password, isTextMode } = e.data

  try {
    self.postMessage({ progress: 0, stage: 'Starting...' })

    // Validate inputs based on encryption mode
    if (encryptionMode === 'pubk') {
      if (mode === 'encrypt' && !publicKey) throw new Error('Public key not provided')
      if (mode === 'decrypt' && !privateKey) throw new Error('Private key not provided')
      if (mode === 'decrypt' && (!/^[0-9a-fA-F]+$/.test(privateKey!) || privateKey!.length !== 64)) {
        throw new Error('Invalid private key format')
      }
    } else {
      // Implicitly handles encryptionMode === 'pwd'
      if (!password) throw new Error('Password not provided')
    }

    if (mode === 'encrypt') {
      self.postMessage({ progress: 10, stage: 'Preparing encryption...' })

      const options = {
        file,
        receiver: encryptionMode === 'pubk' ? base58.decode(publicKey!) : undefined,
        password: encryptionMode === 'pwd' ? password : undefined,
        onProgress: (progress: number) => {
          // Scale progress from 10% to 95%, ensuring it doesn't exceed 95%
          const scaledProgress = 10 + (clampProgress(progress) / 100) * 85
          self.postMessage({ progress: Math.min(scaledProgress, 95), stage: 'Encrypting...' })
        },
        onStage: (stage: string) => {
          self.postMessage({ progress: undefined, stage })
        }
      }

      const result = encryptionMode === 'pubk'
        ? await streamEncrypt.withPublicKey(options)
        : await streamEncrypt.withPassword(options)

      self.postMessage({ progress: 100, stage: 'Complete!' })
      const outputFilename = isTextMode ? `encrypted_text_${Date.now()}.enc` : `${filename}.enc`
      self.postMessage({ data: { data: result, filename: outputFilename } })
    } else if (mode === 'decrypt') {
      self.postMessage({ progress: 10, stage: 'Reading header...' })

      // Read header to get extension
      const headerData = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(new Error('Failed to read file header'))
        reader.readAsArrayBuffer(file.slice(0, 2048))
      })
      const { header } = parseStreamHeader(new Uint8Array(headerData))

      self.postMessage({ progress: 20, stage: 'Preparing decryption...' })

      const options = {
        file,
        receiver: encryptionMode === 'pubk' ? Buffer.from(privateKey!, 'hex') : undefined,
        password: encryptionMode === 'pwd' ? password : undefined,
        onProgress: (progress: number) => {
          // Scale progress from 20% to 95%, ensuring it doesn't exceed 95%
          const scaledProgress = 20 + (clampProgress(progress) / 100) * 75
          self.postMessage({ progress: Math.min(scaledProgress, 95), stage: 'Decrypting...' })
        },
        onStage: (stage: string) => {
          self.postMessage({ progress: undefined, stage })
        }
      }

      const result = encryptionMode === 'pubk'
        ? await streamDecrypt.withPrivateKey(options)
        : await streamDecrypt.withPassword(options)

      self.postMessage({ progress: 100, stage: 'Complete!' })
      const outputExtension = header.ext || (isTextMode ? 'txt' : 'bin')
      const outputFilename = isTextMode ? `${Date.now()}.txt` : `${Date.now()}.${outputExtension}`
      self.postMessage({ data: { data: result, filename: outputFilename, originalExtension: outputExtension } })
    } else {
      throw new Error('Unsupported operation')
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'An error occurred' })
  }
}
