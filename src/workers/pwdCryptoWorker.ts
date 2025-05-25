import { encrypt, decrypt, checkDecryptHeader } from '@/lib/crypto'
import { getFileExtension } from '@/lib/utils'

interface WorkerInput {
  mode: 'encrypt' | 'decrypt'
  chunks: ArrayBuffer[]
  password?: string
  encryptionMode: 'password'
  filename: string
  isTextMode: boolean
}

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { mode, chunks, password, encryptionMode, filename, isTextMode } = e.data

  try {
    self.postMessage({ progress: 0, stage: 'Starting...' })

    if (encryptionMode !== 'password') {
      throw new Error('Unsupported encryption mode')
    }
    if (!password) {
      throw new Error('Password not provided')
    }

    // Combine chunks into a single buffer
    self.postMessage({ progress: 10, stage: 'Combining data...' })
    const totalLength = chunks.reduce((sum: number, chunk: ArrayBuffer) => sum + chunk.byteLength, 0)
    const combinedData = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      combinedData.set(new Uint8Array(chunk), offset)
      offset += chunk.byteLength
    }

    if (mode === 'encrypt') {
      self.postMessage({ progress: 20, stage: 'Encrypting data...' })

      const ext = isTextMode ? 'txt' : getFileExtension(filename)
      const result = encrypt({
        data: combinedData,
        password,
        ext
      })

      self.postMessage({ progress: 80, stage: 'Preparing output...' })
      const outputFilename = isTextMode ? `encrypted_text_${Date.now()}.enc` : `${filename}.enc`
      self.postMessage({ progress: 100, stage: 'Complete!' })
      self.postMessage({ data: { data: result.buffer, filename: outputFilename } })
    } else if (mode === 'decrypt') {
      self.postMessage({ progress: 20, stage: 'Validating data...' })
      const header = checkDecryptHeader({
        data: combinedData,
        password
      })

      self.postMessage({ progress: 30, stage: 'Decrypting data...' })
      const result = decrypt({
        data: combinedData,
        password
      })

      self.postMessage({ progress: 90, stage: 'Preparing output...' })
      const outputFilename = isTextMode ? `${Date.now()}.txt` : `${Date.now()}.${result.ext}`
      self.postMessage({ progress: 100, stage: 'Complete!' })
      self.postMessage({ data: { data: result.payload.buffer, filename: outputFilename, originalExtension: result.ext } })
    } else {
      throw new Error('Unsupported operation')
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'An error occurred' })
  }
}
