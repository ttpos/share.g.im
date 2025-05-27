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

// Simulate progress for small files or fast operations
// eslint-disable-next-line no-unused-vars
function simulateProgress(start: number, end: number, duration: number, callback: (progress: number) => void) {
  const steps = 10
  const stepDuration = duration / steps
  let currentProgress = start
  const increment = (end - start) / steps

  const interval = setInterval(() => {
    currentProgress += increment
    if (currentProgress >= end) {
      clearInterval(interval)
      callback(end)
    } else {
      callback(currentProgress)
    }
  }, stepDuration)
}

// Handle messages in the worker
self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { mode, encryptionMode, file, filename, publicKey, privateKey, password, isTextMode } = e.data

  try {
    self.postMessage({ progress: 0, stage: 'Starting...' })

    // Validate inputs based on encryption mode
    if (encryptionMode === 'pubk') {
      if (mode === 'encrypt' && !publicKey) {
        throw new Error('Public key not provided')
      }
      if (mode === 'decrypt' && !privateKey) {
        throw new Error('Private key not provided')
      }
      if (mode === 'decrypt' && (!/^[0-9a-fA-F]+$/.test(privateKey!) || privateKey!.length !== 64)) {
        throw new Error('Invalid private key format')
      }
    } else if (encryptionMode === 'pwd') {
      if (!password) {
        throw new Error('Password not provided')
      }
    } else {
      throw new Error('Unsupported encryption mode')
    }

    if (mode === 'encrypt') {
      self.postMessage({ progress: 10, stage: 'Preparing encryption...' })
      self.postMessage({ progress: 15, stage: 'Deriving key...' })

      // Simulate progress for small files (<1MB)
      if (file.size < 1024 * 1024) {
        simulateProgress(15, 50, 500, (progress) => {
          self.postMessage({ progress, stage: 'Encrypting...' })
        })
      }

      const options = {
        file,
        receiver: encryptionMode === 'pubk' ? base58.decode(publicKey!) : undefined,
        password: encryptionMode === 'pwd' ? password : undefined,
        onProgress: (progress: number) => {
          // Scale progress to 50-80% for encryption phase
          const scaledProgress = 50 + progress * 30
          self.postMessage({ progress: scaledProgress, stage: 'Encrypting...' })
        },
        onStage: (stage: string) => {
          self.postMessage({ progress: undefined, stage })
        }
      }

      const result = encryptionMode === 'pubk'
        ? await streamEncrypt.withPublicKey(options)
        : await streamEncrypt.withPassword(options)

      self.postMessage({ progress: 90, stage: 'Preparing output...' })
      const outputFilename = isTextMode ? `encrypted_text_${Date.now()}.enc` : `${filename}.enc`
      self.postMessage({ progress: 100, stage: 'Complete!' })
      self.postMessage({ data: { data: result, filename: outputFilename } })
    } else if (mode === 'decrypt') {
      self.postMessage({ progress: 10, stage: 'Preparing decryption...' })
      self.postMessage({ progress: 12, stage: 'Reading header...' })

      // Read header to get extension
      const headerData = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(new Error('Failed to read file header'))
        reader.readAsArrayBuffer(file.slice(0, 2048))
      })
      const { header } = parseStreamHeader(new Uint8Array(headerData))

      self.postMessage({ progress: 15, stage: 'Deriving key...' })

      // Simulate progress for small files (<1MB)
      if (file.size < 1024 * 1024) {
        simulateProgress(15, 50, 500, (progress) => {
          self.postMessage({ progress, stage: 'Decrypting...' })
        })
      }

      const options = {
        file,
        receiver: encryptionMode === 'pubk' ? Buffer.from(privateKey!, 'hex') : undefined,
        password: encryptionMode === 'pwd' ? password : undefined,
        onProgress: (progress: number) => {
          // Scale progress to 50-80% for decryption phase
          const scaledProgress = 50 + progress * 30
          self.postMessage({ progress: scaledProgress, stage: 'Decrypting...' })
        },
        onStage: (stage: string) => {
          self.postMessage({ progress: undefined, stage })
        }
      }

      const result = encryptionMode === 'pubk'
        ? await streamDecrypt.withPrivateKey(options)
        : await streamDecrypt.withPassword(options)

      self.postMessage({ progress: 90, stage: 'Preparing output...' })
      const outputExtension = header.ext || (isTextMode ? 'txt' : 'bin')
      const outputFilename = isTextMode ? `${Date.now()}.txt` : `${Date.now()}.${outputExtension}`
      self.postMessage({ progress: 100, stage: 'Complete!' })
      self.postMessage({ data: { data: result, filename: outputFilename, originalExtension: outputExtension } })
    } else {
      throw new Error('Unsupported operation')
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'An error occurred' })
  }
}
