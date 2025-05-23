import { encrypt, decrypt } from 'eciesjs'

import { validateBase58PublicKey } from '@/lib/utils'

self.onmessage = async (e: MessageEvent) => {
  let { filename } = e.data
  const { mode, chunks, publicKey, privateKey, isTextMode } = e.data

  try {
    if (mode === 'encrypt') {
      if (!publicKey) {
        throw new Error('Public key not provided')
      }

      const validation = validateBase58PublicKey(publicKey)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
      const pubKeyBytes = validation.pubKeyBytes!

      // Encrypt each chunk
      const encryptedChunks: Uint8Array[] = []
      for (const chunk of chunks) {
        const encrypted = encrypt(pubKeyBytes, Buffer.from(chunk))
        encryptedChunks.push(encrypted)
      }

      if (isTextMode) {
        // For text mode, return the first encrypted chunk directly (no metadata)
        if (encryptedChunks.length !== 1) {
          throw new Error('Text mode expects exactly one chunk')
        }
        self.postMessage({
          data: {
            data: encryptedChunks[0].buffer,
            filename: filename
          }
        })
      } else {
        // For file mode, include metadata (filename and chunk lengths)
        const nameBuffer = new TextEncoder().encode(filename)
        const nameLength = nameBuffer.length
        if (nameLength > 255) {
          throw new Error('Filename too long, please rename and try again')
        }

        let totalLength = 1 + nameLength // nameLength byte + filename
        encryptedChunks.forEach(chunk => totalLength += 4 + chunk.length) // 4 bytes for chunk length

        const resultArray = new Uint8Array(totalLength)
        let offset = 0

        resultArray.set([nameLength], offset)
        offset += 1
        resultArray.set(nameBuffer, offset)
        offset += nameLength

        for (const chunk of encryptedChunks) {
          const chunkLength = chunk.length
          resultArray.set(new Uint8Array(new Uint32Array([chunkLength]).buffer), offset)
          offset += 4
          resultArray.set(chunk, offset)
          offset += chunk.length
        }

        self.postMessage({
          data: {
            data: resultArray.buffer,
            filename: filename + '.enc'
          }
        })
      }
    } else if (mode === 'decrypt') {
      if (!privateKey) {
        throw new Error('Private key not provided')
      }
      if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
        throw new Error('Invalid private key format')
      }
      if (privateKey.length !== 64) {
        throw new Error('Invalid private key length. Must be 32 bytes (64 hex characters)')
      }

      // Combine chunks into a single buffer
      const totalLength = chunks.reduce((sum: number, chunk: ArrayBuffer) => sum + chunk.byteLength, 0)
      const combinedData = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        combinedData.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }

      const decryptedChunks: Uint8Array[] = []
      let totalDecryptedLength = 0

      if (isTextMode) {
        // For text mode, treat the entire data as a single encrypted chunk
        try {
          const decrypted = decrypt(Buffer.from(privateKey, 'hex'), combinedData)
          decryptedChunks.push(decrypted)
          totalDecryptedLength += decrypted.length
        } catch (err) {
          throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Invalid private key or corrupted data'}`)
        }
      } else {
        // For file mode, parse metadata and decrypt chunks
        offset = 0
        if (combinedData.length < 1) {
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
        const originalName = new TextDecoder().decode(combinedData.slice(offset, offset + nameLength))
        offset += nameLength

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

        // Decrypt each chunk
        for (const chunk of encryptedChunks) {
          try {
            const decrypted = decrypt(Buffer.from(privateKey, 'hex'), chunk)
            decryptedChunks.push(decrypted)
            totalDecryptedLength += decrypted.length
          } catch (err) {
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Invalid private key or corrupted chunk'}`)
          }
        }

        // Update filename for file mode
        filename = originalName
      }

      // Combine decrypted chunks
      const resultArray = new Uint8Array(totalDecryptedLength)
      let currentOffset = 0
      for (const chunk of decryptedChunks) {
        resultArray.set(chunk, currentOffset)
        currentOffset += chunk.length
      }

      self.postMessage({
        data: {
          data: resultArray.buffer,
          filename: filename
        }
      })
    } else {
      throw new Error('Unsupported operation')
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'An error occurred' })
  }
}
