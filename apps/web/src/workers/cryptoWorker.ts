import { base58 } from '@scure/base'
import { streamCrypto, textCrypto, parseStreamHeader, detect } from '@ttpos/share-utils'

// Interface for worker input
interface WorkerInput {
  mode: 'encrypt' | 'decrypt'
  encryptionMode: 'pubk' | 'pwd'
  file?: File
  filename?: string
  text?: string
  publicKey?: string // For pubk encryption
  privateKey?: string // For pubk decryption
  password?: string // For pwd encryption/decryption
  isTextMode: boolean
}

// Clamp progress value between 0 and 100
const clampProgress = (progress: number): number => Math.min(Math.max(progress, 0), 100)

// Handle messages in the worker
self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const {
    mode,
    encryptionMode,
    file,
    filename,
    text,
    publicKey,
    privateKey,
    password,
    isTextMode
  } = e.data

  try {
    self.postMessage({ progress: 0, stage: 'Starting...' })

    // Detect input type and encryption mode
    self.postMessage({ progress: 5, stage: 'Detecting input type...' })

    let detection: Awaited<ReturnType<typeof detect>>
    if (isTextMode && text) {
      detection = await detect(text)
    } else if (file) {
      detection = await detect(file)
    } else {
      throw new Error('No valid input provided')
    }

    // Validate inputs based on encryption mode and detection
    if (encryptionMode === 'pubk') {
      if (mode === 'encrypt' && !publicKey) throw new Error('Public key not provided')
      if (mode === 'decrypt' && !privateKey) throw new Error('Private key not provided')
      if (mode === 'decrypt' && (!/^[0-9a-fA-F]+$/.test(privateKey!) || privateKey!.length !== 64)) {
        throw new Error('Invalid private key format')
      }
      if (mode === 'decrypt' && detection.encryptionType === 'pwd') {
        throw new Error('Input is password-encrypted, but public key mode selected')
      }
    } else if (encryptionMode === 'pwd') {
      if (!password) throw new Error('Password not provided')
      if (mode === 'decrypt' && (detection.encryptionType === 'pubk' || detection.encryptionType === 'signed')) {
        throw new Error('Input is public key-encrypted, but password mode selected')
      }
    } else {
      throw new Error('Invalid encryption mode')
    }

    if (isTextMode) {
      // Handle text encryption/decryption
      if (!text) throw new Error('Text input not provided')

      self.postMessage({ progress: 10, stage: 'Preparing text processing...' })

      if (mode === 'encrypt') {
        const receiver = encryptionMode === 'pubk' ? base58.decode(publicKey!) : undefined
        const result = await textCrypto.encrypt(text, encryptionMode === 'pwd' ? password : undefined, receiver)

        self.postMessage({ progress: 100, stage: 'Complete!' })
        self.postMessage({
          data: {
            data: result.blob,
            base64: result.base64,
            filename: `encrypted_text_${Date.now()}.enc`
          }
        })
      } else {
        const receiver = encryptionMode === 'pubk' && privateKey ? Buffer.from(privateKey, 'hex') : undefined
        const _password = encryptionMode === 'pwd' ? password : undefined
        const result = await textCrypto.decrypt(text.trim(), _password, receiver)

        self.postMessage({ progress: 100, stage: 'Complete!' })
        self.postMessage({
          data: {
            data: new Blob([result.text], { type: 'text/plain' }),
            base64: result.text,
            filename: `${Date.now()}.txt`,
            signatureValid: result.signatureValid
          }
        })
      }
    } else {
      // Handle file encryption/decryption
      if (!file || !filename) throw new Error('File or filename not provided')

      if (mode === 'encrypt') {
        self.postMessage({ progress: 10, stage: 'Preparing encryption...' })

        const options = {
          file,
          receiver: encryptionMode === 'pubk' ? base58.decode(publicKey!) : undefined,
          password: encryptionMode === 'pwd' ? password : undefined,
          onProgress: (progress: number) => {
            const scaledProgress = 10 + (clampProgress(progress) / 100) * 85
            self.postMessage({ progress: Math.min(scaledProgress, 95), stage: 'Encrypting...' })
          },
          onStage: (stage: string) => {
            self.postMessage({ progress: undefined, stage })
          }
        }

        const result = encryptionMode === 'pubk'
          ? await streamCrypto.encrypt.withPublicKey(options)
          : await streamCrypto.encrypt.withPassword(options)

        self.postMessage({ progress: 100, stage: 'Complete!' })
        self.postMessage({ data: { data: result, filename: `${filename}.enc` } })
      } else {
        self.postMessage({ progress: 10, stage: 'Reading header...' })

        const headerData = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as ArrayBuffer)
          reader.onerror = () => reject(new Error('Failed to read file header'))
          reader.readAsArrayBuffer(file.slice(0, 2048))
        })

        const receiver = encryptionMode === 'pubk' && privateKey ? Buffer.from(privateKey, 'hex') : undefined
        const _password = encryptionMode === 'pwd' ? password : undefined
        const { header } = parseStreamHeader(new Uint8Array(headerData), _password, receiver)

        self.postMessage({ progress: 20, stage: 'Preparing decryption...' })

        const options = {
          file,
          receiver,
          password: _password,
          onProgress: (progress: number) => {
            const scaledProgress = 20 + (clampProgress(progress) / 100) * 75
            self.postMessage({ progress: Math.min(scaledProgress, 95), stage: 'Decrypting...' })
          },
          onStage: (stage: string) => {
            self.postMessage({ progress: undefined, stage })
          }
        }

        const result = encryptionMode === 'pubk'
          ? await streamCrypto.decrypt.withPrivateKey(options)
          : await streamCrypto.decrypt.withPassword(options)

        self.postMessage({ progress: 100, stage: 'Complete!' })
        const outputExtension = header.e || 'bin'
        const outputFilename = `${Date.now()}.${outputExtension}`
        self.postMessage({
          data: {
            data: result.file,
            filename: outputFilename,
            originalExtension: outputExtension,
            signatureValid: result.signatureValid
          }
        })
      }
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'An error occurred' })
  }
}
