import { encrypt, decrypt } from 'eciesjs'

import { getFileExtension, getFilenameWithoutExtension, validateBase58PublicKey } from '@/lib/utils'

/**
 * Web Worker message handler for encryption/decryption operations
 */
self.onmessage = async (e: MessageEvent) => {
  const { mode, chunks, publicKey, filename, privateKey, isTextMode } = e.data

  try {
    // Initialize progress
    self.postMessage({ progress: 0, stage: 'Starting...' })

    if (mode === 'encrypt') {
      // Validate encryption requirements
      if (!publicKey) {
        throw new Error('Public key not provided')
      }

      self.postMessage({ progress: 10, stage: 'Validating public key...' })
      const validation = validateBase58PublicKey(publicKey)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
      const pubKeyBytes = validation.pubKeyBytes!

      self.postMessage({ progress: 20, stage: 'Encrypting data...' })

      // Encrypt data
      const encryptedChunks: Uint8Array[] = []
      const totalChunks = chunks.length
      for (let i = 0; i < chunks.length; i++) {
        const encrypted = encrypt(pubKeyBytes, Buffer.from(chunks[i]))
        encryptedChunks.push(encrypted)
        self.postMessage({ progress: 20 + ((i + 1) / totalChunks) * 60 })
      }

      self.postMessage({ progress: 80, stage: 'Preparing output...' })

      if (isTextMode) {
        // Handle text mode (single chunk, no metadata)
        if (encryptedChunks.length !== 1) throw new Error('Text mode expects exactly one chunk')
        self.postMessage({ progress: 100, stage: 'Complete!' })
        self.postMessage({ data: { data: encryptedChunks[0].buffer, filename } })
      } else {
        // Handle file mode with metadata
        const nameWithoutExt = getFilenameWithoutExtension(filename)
        const originalExtension = getFileExtension(filename)
        const nameBuffer = new TextEncoder().encode(nameWithoutExt)
        const extensionBuffer = new TextEncoder().encode(originalExtension)
        const nameLength = nameBuffer.length
        const extensionLength = extensionBuffer.length

        if (nameLength > 255) throw new Error('Filename too long, please rename and try again')
        if (extensionLength > 255) throw new Error('File extension too long')

        self.postMessage({ progress: 90, stage: 'Building encrypted file...' })

        // Construct output buffer
        let totalLength = 1 + nameLength + 1 + extensionLength
        encryptedChunks.forEach(chunk => totalLength += 4 + chunk.length)
        const resultArray = new Uint8Array(totalLength)
        let offset = 0

        resultArray.set([nameLength], offset)
        offset += 1
        resultArray.set(nameBuffer, offset)
        offset += nameLength
        resultArray.set([extensionLength], offset)
        offset += 1
        resultArray.set(extensionBuffer, offset)
        offset += extensionLength

        for (const chunk of encryptedChunks) {
          const chunkLength = chunk.length
          resultArray.set(new Uint8Array(new Uint32Array([chunkLength]).buffer), offset)
          offset += 4
          resultArray.set(chunk, offset)
          offset += chunk.length
        }

        self.postMessage({ progress: 100, stage: 'Complete!' })
        self.postMessage({ data: { data: resultArray.buffer, filename: filename + '.enc' } })
      }
    } else if (mode === 'decrypt') {
      // Validate decryption requirements
      if (!privateKey) throw new Error('Private key not provided')
      if (!/^[0-9a-fA-F]+$/.test(privateKey)) throw new Error('Invalid private key format')
      if (privateKey.length !== 64) throw new Error('Invalid private key length. Must be 32 bytes (64 hex characters)')

      self.postMessage({ progress: 10, stage: 'Validating private key...' })

      // Combine input data
      self.postMessage({ progress: 20, stage: 'Preparing encrypted data...' })
      const totalLength = chunks.reduce((sum: number, chunk: ArrayBuffer) => sum + chunk.byteLength, 0)
      const combinedData = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        combinedData.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }

      const decryptedChunks: Uint8Array[] = []
      let totalDecryptedLength = 0
      let originalExtension = 'txt'

      if (isTextMode) {
        // Decrypt text mode data
        self.postMessage({ progress: 30, stage: 'Decrypting data...' })
        try {
          const decrypted = decrypt(Buffer.from(privateKey, 'hex'), combinedData)
          decryptedChunks.push(decrypted)
          totalDecryptedLength += decrypted.length
          self.postMessage({ progress: 90, stage: 'Preparing decrypted text...' })
        } catch (err) {
          throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Invalid private key or corrupted data'}`)
        }
      } else {
        // Parse file metadata
        self.postMessage({ progress: 30, stage: 'Parsing file metadata...' })
        offset = 0
        if (combinedData.length < 2) {
          throw new Error('Invalid file format: File too small')
        }

        const nameLength = combinedData[offset]
        if (nameLength > 255 || nameLength < 0) {
          throw new Error('Invalid file format: Invalid name length')
        }
        offset += 1

        if (offset + nameLength > combinedData.length) {
          throw new Error('Invalid file format: Name length exceeds data')
        }

        offset += nameLength
        const extensionLength = combinedData[offset]
        if (extensionLength > 255 || extensionLength < 0) {
          throw new Error('Invalid file format: Invalid extension length')
        }
        offset += 1

        if (offset + extensionLength > combinedData.length) {
          throw new Error('Invalid file format: Extension length exceeds data')
        }
        originalExtension = new TextDecoder().decode(combinedData.slice(offset, offset + extensionLength))
        offset += extensionLength

        self.postMessage({ progress: 40, stage: 'Extracting encrypted data...' })

        // Extract encrypted chunks
        const encryptedChunks: Uint8Array[] = []
        while (offset < combinedData.length) {
          if (offset + 4 > combinedData.length) {
            throw new Error('Invalid file format: Missing chunk length')
          }
          const chunkLength = new Uint32Array(combinedData.slice(offset, offset + 4).buffer)[0]
          offset += 4
          if (offset + chunkLength > combinedData.length) {
            throw new Error('Invalid file format: Chunk length exceeds data')
          }
          const chunk = combinedData.slice(offset, offset + chunkLength)
          offset += chunkLength
          encryptedChunks.push(chunk)
        }

        if (encryptedChunks.length === 0) {
          throw new Error('Invalid file format: No encrypted chunks found')
        }

        self.postMessage({ progress: 50, stage: 'Decrypting data...' })

        // Decrypt chunks
        const totalChunks = encryptedChunks.length
        for (let i = 0; i < encryptedChunks.length; i++) {
          try {
            const decrypted = decrypt(Buffer.from(privateKey, 'hex'), encryptedChunks[i])
            decryptedChunks.push(decrypted)
            totalDecryptedLength += decrypted.length
            self.postMessage({ progress: 50 + ((i + 1) / totalChunks) * 30 })
          } catch (err) {
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Invalid private key or corrupted chunk'}`)
          }
        }

        self.postMessage({ progress: 80, stage: 'Preparing decrypted file...' })
      }

      // Combine decrypted data
      self.postMessage({ progress: 90, stage: 'Finalizing...' })
      const resultArray = new Uint8Array(totalDecryptedLength)
      let currentOffset = 0
      for (const chunk of decryptedChunks) {
        resultArray.set(chunk, currentOffset)
        currentOffset += chunk.length
      }

      self.postMessage({ progress: 100, stage: 'Complete!' })
      self.postMessage({
        data: {
          data: resultArray.buffer,
          filename, originalExtension
        }
      })
    } else {
      throw new Error('Unsupported operation')
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'An error occurred' })
  }
}
