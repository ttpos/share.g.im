import { base58 } from '@scure/base'

import { encrypt, decrypt, checkDecryptHeader } from '@/lib/crypto'
import { getFileExtension } from '@/lib/utils'

interface WorkerInput {
  mode: 'encrypt' | 'decrypt'
  chunks: ArrayBuffer[]
  publicKey?: string
  privateKey?: string
  filename: string
  isTextMode: boolean
}

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { mode, chunks, publicKey, privateKey, filename, isTextMode } = e.data

  try {
    self.postMessage({ progress: 0, stage: 'Starting...' })

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
      if (!publicKey) throw new Error('Public key not provided')
      self.postMessage({ progress: 20, stage: 'Encrypting data...' })

      const ext = isTextMode ? 'txt' : getFileExtension(filename)
      const result = encrypt({
        data: combinedData,
        receiver: base58.decode(publicKey),
        ext
      })

      self.postMessage({ progress: 80, stage: 'Preparing output...' })
      const outputFilename = isTextMode ? `encrypted_text_${Date.now()}.enc` : `${filename}.enc`
      self.postMessage({ progress: 100, stage: 'Complete!' })
      self.postMessage({ data: { data: result.buffer, filename: outputFilename } })
    } else if (mode === 'decrypt') {
      if (!privateKey) throw new Error('Private key not provided')
      if (!/^[0-9a-fA-F]+$/.test(privateKey) || privateKey.length !== 64) {
        throw new Error('Invalid private key format')
      }

      self.postMessage({ progress: 20, stage: 'Validating data...' })
      const header = checkDecryptHeader({
        data: combinedData,
        receiver: Buffer.from(privateKey, 'hex')
      })

      self.postMessage({ progress: 30, stage: 'Decrypting data...' })
      const result = decrypt({
        data: combinedData,
        receiver: Buffer.from(privateKey, 'hex')
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
