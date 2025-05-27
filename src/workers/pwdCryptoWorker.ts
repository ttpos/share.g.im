import { streamEncrypt, streamDecrypt, parseStreamHeader } from '@/lib/crypto-stream'

// Interface for worker input
interface WorkerInput {
  mode: 'encrypt' | 'decrypt'
  file: File
  filename: string
  password?: string
  isTextMode: boolean
}

// Handle messages in the worker
self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { mode, file, filename, password, isTextMode } = e.data

  try {
    self.postMessage({ progress: 0, stage: 'Starting...' })

    if (!password) {
      throw new Error('Password not provided')
    }

    if (mode === 'encrypt') {
      self.postMessage({ progress: 10, stage: 'Preparing encryption...' })

      const options = {
        file,
        password,
        onProgress: (progress: number) => {
          self.postMessage({ progress, stage: 'Encrypting...' })
        },
        onStage: (stage: string) => {
          self.postMessage({ progress: undefined, stage })
        }
      }

      const result = await streamEncrypt.withPassword(options)
      self.postMessage({ progress: 90, stage: 'Preparing output...' })

      const outputFilename = isTextMode ? `encrypted_text_${Date.now()}.enc` : `${filename}.enc`
      self.postMessage({ progress: 100, stage: 'Complete!' })
      self.postMessage({ data: { data: result, filename: outputFilename } })
    } else if (mode === 'decrypt') {
      self.postMessage({ progress: 10, stage: 'Preparing decryption...' })

      // Read header to get extension
      const headerData = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(new Error('Failed to read file header'))
        reader.readAsArrayBuffer(file.slice(0, 2048))
      })
      const { header } = parseStreamHeader(new Uint8Array(headerData))

      const options = {
        file,
        password,
        onProgress: (progress: number) => {
          self.postMessage({ progress, stage: 'Decrypting...' })
        },
        onStage: (stage: string) => {
          self.postMessage({ progress: undefined, stage })
        }
      }

      const result = await streamDecrypt.withPassword(options)
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
