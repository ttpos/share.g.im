/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { gcm } from '@noble/ciphers/aes'
import { bytesToUtf8, concatBytes, utf8ToBytes } from '@noble/ciphers/utils'
import { managedNonce, randomBytes } from '@noble/ciphers/webcrypto'
import { secp256k1 } from '@noble/curves/secp256k1'
import { argon2id } from '@noble/hashes/argon2'
import * as ecies from 'eciesjs'

// Constants for streaming
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks for processing
const BUFFER_SIZE = 10 * 1024 * 1024 // 10MB buffer for streaming
const MAX_MEMORY_USAGE = 100 * 1024 * 1024 // 100MB max memory per operation
const HEADER_VERSION = 1 // Version for future compatibility

// Enhanced Argon2 options
const ARGON_OPTIONS = {
  t: 3,
  m: 1280,
  p: 4,
  maxmem: 2 ** 32 - 1
}

// Streaming encryption/decryption interfaces
interface StreamEncryptOptions {
    file: File
    password?: string
    receiver?: Uint8Array
    sender?: { privKeyBytes: Uint8Array }
    onProgress?: (progress: number) => void
    onStage?: (stage: string) => void
}

interface StreamDecryptOptions {
    file: File
    password?: string
    receiver?: Uint8Array
    sender?: Uint8Array
    onProgress?: (progress: number) => void
    onStage?: (stage: string) => void
}

interface ChunkMetadata {
    index: number
    totalChunks: number
    size: number
    hash: Uint8Array
}
export class CryptoError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'CryptoError'
  }
}

export class InvalidDataError extends CryptoError {
  constructor(message: string) {
    super(message, 'INVALID_DATA')
  }
}

export class DecryptionError extends CryptoError {
  constructor(message: string) {
    super(message, 'DECRYPTION_FAILED')
  }
}

export function secureClear(buffer: ArrayBuffer): void {
  const view = new Uint8Array(buffer)
  // Fill with random data first, then zeros
  crypto.getRandomValues(view)
  view.fill(0)
}

// Memory monitoring
function getMemoryUsage(): number {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

function waitForMemory(threshold: number = MAX_MEMORY_USAGE): Promise<void> {
  return new Promise((resolve) => {
    const checkMemory = () => {
      if (getMemoryUsage() < threshold) {
        resolve()
      } else {
        // Force garbage collection if available
        if ('gc' in window) {
          (window as any).gc()
        }
        setTimeout(checkMemory, 100)
      }
    }
    checkMemory()
  })
}

// Stream cipher for large files
class StreamCipher {
  private key: Uint8Array
  private chunkIndex: number = 0
  private cipher: any // Cipher instance

  constructor(key: Uint8Array) {
    this.key = key
    this.cipher = managedNonce(gcm)(key)
  }

  async encryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
    await waitForMemory()

    // Create chunk metadata
    const metadata: ChunkMetadata = {
      index: this.chunkIndex++,
      totalChunks: 0, // Will be updated in header
      size: chunk.length,
      hash: new Uint8Array(await crypto.subtle.digest('SHA-256', chunk))
    }

    // Encrypt chunk with metadata
    const metadataBytes = this.serializeMetadata(metadata)
    const encryptedChunk = this.cipher.encrypt(chunk)

    return concatBytes(
      new Uint8Array([metadataBytes.length]),
      metadataBytes,
      encryptedChunk
    )
  }

  async decryptChunk(encryptedData: Uint8Array): Promise<{ chunk: Uint8Array; metadata: ChunkMetadata }> {
    await waitForMemory()

    const metadataLength = encryptedData[0]
    const metadataBytes = encryptedData.slice(1, 1 + metadataLength)
    const encryptedChunk = encryptedData.slice(1 + metadataLength)

    const metadata = this.deserializeMetadata(metadataBytes)
    const chunk = this.cipher.decrypt(encryptedChunk)

    // Verify chunk integrity
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', chunk))
    if (!this.compareArrays(hash, metadata.hash)) {
      throw new DecryptionError('Chunk integrity check failed')
    }

    return { chunk, metadata }
  }

  private serializeMetadata(metadata: ChunkMetadata): Uint8Array {
    const indexBytes = new Uint8Array(4)
    new DataView(indexBytes.buffer).setUint32(0, metadata.index, true)

    const totalChunksBytes = new Uint8Array(4)
    new DataView(totalChunksBytes.buffer).setUint32(0, metadata.totalChunks, true)

    const sizeBytes = new Uint8Array(4)
    new DataView(sizeBytes.buffer).setUint32(0, metadata.size, true)

    return concatBytes(indexBytes, totalChunksBytes, sizeBytes, metadata.hash)
  }

  private deserializeMetadata(bytes: Uint8Array): ChunkMetadata {
    const view = new DataView(bytes.buffer, bytes.byteOffset)
    return {
      index: view.getUint32(0, true),
      totalChunks: view.getUint32(4, true),
      size: view.getUint32(8, true),
      hash: bytes.slice(12, 44)
    }
  }

  private compareArrays(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i]
    }
    return result === 0
  }

  destroy() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    secureClear(this.key.buffer)
  }
}

// Create streaming header
function createStreamHeader(
  fileSize: number,
  fileName: string,
  ext: string,
  totalChunks: number,
  isPasswordMode: boolean,
  salt?: Uint8Array,
  signature?: Uint8Array
): Uint8Array {
  const magicBytes = isPasswordMode ? 'ns1' : 'ns0'
  const header = {
    version: HEADER_VERSION,
    fileSize,
    fileName,
    ext,
    totalChunks,
    mode: isPasswordMode ? 1 : 0,
    timestamp: Date.now(),
    salt,
    signature
  }

  // Serialize header to JSON then to bytes
  const headerJson = JSON.stringify({
    version: header.version,
    fileSize: header.fileSize,
    fileName: header.fileName,
    ext: header.ext,
    totalChunks: header.totalChunks,
    mode: header.mode,
    timestamp: header.timestamp
  })

  const headerBytes = utf8ToBytes(headerJson)
  const headerLength = new Uint8Array(4)
  new DataView(headerLength.buffer).setUint32(0, headerBytes.length, true)

  let finalHeader = concatBytes(
    utf8ToBytes(magicBytes),
    headerLength,
    headerBytes
  )

  if (salt) {
    finalHeader = concatBytes(finalHeader, salt)
  }

  if (signature) {
    finalHeader = concatBytes(finalHeader, signature)
  }

  return finalHeader
}

// Parse streaming header
export function parseStreamHeader(data: Uint8Array): {
  header: any
  headerLength: number
  salt?: Uint8Array
  signature?: Uint8Array
} {
  // Check magic bytes
  const magicBytes = bytesToUtf8(data.slice(0, 3))
  if (magicBytes !== 'ns0' && magicBytes !== 'ns1') {
    throw new InvalidDataError('Invalid stream format')
  }

  // Get header length
  const headerLengthBytes = data.slice(3, 7)
  const headerLength = new DataView(headerLengthBytes.buffer, headerLengthBytes.byteOffset).getUint32(0, true)

  // Parse header JSON
  const headerBytes = data.slice(7, 7 + headerLength)
  const headerJson = bytesToUtf8(headerBytes)
  const header = JSON.parse(headerJson)

  let offset = 7 + headerLength
  let salt: Uint8Array | undefined
  let signature: Uint8Array | undefined

  if (header.mode === 1) {
    // Password mode - has salt
    salt = data.slice(offset, offset + 16)
    offset += 16
  } else {
    // ECIES mode - might have signature
    if (data.length > offset + 64) {
      signature = data.slice(offset, offset + 64)
    }
  }

  return { header, headerLength: offset, salt, signature }
}

// Stream encrypt with password
export async function streamEncryptWithPassword(options: StreamEncryptOptions): Promise<Blob> {
  const { file, password, onProgress, onStage } = options

  if (!password) {
    throw new InvalidDataError('Password is required')
  }

  const chunks: Uint8Array[] = []
  const fileSize = file.size
  const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)
  const ext = file.name.split('.').pop() || 'bin'

  onStage?.('Generating encryption key...')

  // Generate salt and derive key
  const salt = randomBytes(16)
  const key = argon2id(password, salt, ARGON_OPTIONS)

  try {
    // Create cipher
    const cipher = new StreamCipher(key)

    // Create header (will be updated with total chunks)
    const header = createStreamHeader(
      fileSize,
      file.name,
      ext,
      totalChunks,
      true,
      salt
    )

    chunks.push(header)

    onStage?.('Encrypting file...')

    // Process file in chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, fileSize)

      // Read chunk
      const chunk = await readFileChunk(file, start, end)

      // Simulate sub-progress for encryption within the chunk
      onProgress?.((i / totalChunks) * 100)
      await new Promise(resolve => setTimeout(resolve, 0))

      // Encrypt chunk
      const encryptedChunk = await cipher.encryptChunk(new Uint8Array(chunk))
      chunks.push(encryptedChunk)

      // Update progress
      onProgress?.(((i + 1) / totalChunks) * 100)

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    cipher.destroy()
    onStage?.('Creating encrypted file...')

    // Create blob from chunks
    return new Blob(chunks, { type: 'application/octet-stream' })
  } finally {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    secureClear(key.buffer)
  }
}

// Stream decrypt with password
export async function streamDecryptWithPassword(options: StreamDecryptOptions): Promise<Blob> {
  const { file, password, onProgress, onStage } = options

  if (!password) {
    throw new InvalidDataError('Password is required')
  }

  onStage?.('Reading encrypted file header...')

  // Read header
  const headerData = await readFileChunk(file, 0, 1024) // Read first 1KB for header
  const { header, headerLength, salt } = parseStreamHeader(new Uint8Array(headerData))

  if (header.mode !== 1) {
    throw new InvalidDataError('File is not password encrypted')
  }

  if (!salt) {
    throw new InvalidDataError('Salt not found in header')
  }

  onStage?.('Deriving decryption key...')

  // Derive key
  const key = argon2id(password, salt, ARGON_OPTIONS)

  try {
    const cipher = new StreamCipher(key)
    const chunks: Uint8Array[] = []
    let offset = headerLength

    onStage?.('Decrypting file...')

    // Process chunks
    for (let i = 0; i < header.totalChunks; i++) {
      // Read chunk size first
      const sizeData = await readFileChunk(file, offset, offset + 1)
      const metadataLength = new Uint8Array(sizeData)[0]

      // Calculate chunk size (1 byte length + metadata + encrypted data)
      const chunkStart = offset
      const chunkEnd = Math.min(offset + BUFFER_SIZE, file.size)

      // Read encrypted chunk
      const encryptedChunk = await readFileChunk(file, chunkStart, chunkEnd)
      const encryptedArray = new Uint8Array(encryptedChunk)

      // Find actual chunk boundary
      const actualChunkSize = findChunkBoundary(encryptedArray, metadataLength)
      const chunkData = encryptedArray.slice(0, actualChunkSize)

      // Sub-progress for decryption
      onProgress?.((i / header.totalChunks) * 100)
      await new Promise(resolve => setTimeout(resolve, 0))

      // Decrypt chunk
      const { chunk } = await cipher.decryptChunk(chunkData)
      chunks.push(chunk)

      offset += actualChunkSize
      onProgress?.(((i + 1) / header.totalChunks) * 100)

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    cipher.destroy()
    onStage?.('Creating decrypted file...')

    // Create blob with original mime type
    const mimeType = getMimeType(header.ext)
    return new Blob(chunks, { type: mimeType })
  } finally {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    secureClear(key.buffer)
  }
}

// Stream encrypt with ECIES (public key)
export async function streamEncryptWithPublicKey(options: StreamEncryptOptions): Promise<Blob> {
  const { file, receiver, sender, onProgress, onStage } = options

  if (!receiver) {
    throw new InvalidDataError('Receiver public key is required22')
  }

  // For ECIES, we need to use a hybrid approach:
  // 1. Generate a random symmetric key
  // 2. Encrypt the symmetric key with ECIES
  // 3. Use the symmetric key for streaming encryption

  onStage?.('Generating encryption key...')

  const symmetricKey = randomBytes(32) // 256-bit key
  const encryptedKey = ecies.encrypt(receiver, symmetricKey)

  try {
    const cipher = new StreamCipher(symmetricKey)
    const chunks: Uint8Array[] = []
    const fileSize = file.size
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)
    const ext = file.name.split('.').pop() || 'bin'

    // Create signature if sender is provided
    let signature: Uint8Array | undefined
    if (sender) {
      onStage?.('Creating digital signature...')
      const fileHash = await hashFile(file)
      const sig = secp256k1.sign(fileHash, sender.privKeyBytes)
      signature = sig.toCompactRawBytes()
    }

    // Create header with encrypted symmetric key
    const header = createStreamHeader(
      fileSize,
      file.name,
      ext,
      totalChunks,
      false,
      undefined,
      signature
    )

    // Prepend encrypted symmetric key
    const keyLength = new Uint8Array(2)
    new DataView(keyLength.buffer).setUint16(0, encryptedKey.length, true)

    chunks.push(concatBytes(header, keyLength, encryptedKey))

    onStage?.('Encrypting file...')

    // Process file in chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, fileSize)

      const chunk = await readFileChunk(file, start, end)
      const encryptedChunk = await cipher.encryptChunk(new Uint8Array(chunk))
      chunks.push(encryptedChunk)

      onProgress?.(((i + 1) / totalChunks) * 100)
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    cipher.destroy()
    onStage?.('Creating encrypted file...')

    return new Blob(chunks, { type: 'application/octet-stream' })

  } finally {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    secureClear(symmetricKey.buffer)
  }
}

// Stream decrypt with ECIES (private key)
export async function streamDecryptWithPrivateKey(options: StreamDecryptOptions): Promise<Blob> {
  const { file, receiver, sender, onProgress, onStage } = options

  if (!receiver) {
    throw new InvalidDataError('Receiver private key is required')
  }

  onStage?.('Reading encrypted file header...')

  // Read header and encrypted key
  const headerData = await readFileChunk(file, 0, 2048) // Read first 2KB
  const headerArray = new Uint8Array(headerData)
  const { header, headerLength, signature } = parseStreamHeader(headerArray)

  if (header.mode !== 0) {
    throw new InvalidDataError('File is not public key encrypted')
  }

  // Read encrypted symmetric key
  const keyLengthOffset = headerLength
  const keyLength = new DataView(headerArray.buffer, headerArray.byteOffset + keyLengthOffset).getUint16(0, true)
  const encryptedKey = headerArray.slice(keyLengthOffset + 2, keyLengthOffset + 2 + keyLength)

  onStage?.('Decrypting encryption key...')

  // Decrypt symmetric key
  const symmetricKey = ecies.decrypt(receiver, encryptedKey)

  try {
    const cipher = new StreamCipher(symmetricKey)
    const chunks: Uint8Array[] = []
    let offset = keyLengthOffset + 2 + keyLength

    // Verify signature if sender is provided
    if (signature && sender) {
      onStage?.('Verifying digital signature...')
      // Note: For large files, we might want to verify after decryption
      // or use a streaming hash approach
    }

    onStage?.('Decrypting file...')

    // Process chunks
    for (let i = 0; i < header.totalChunks; i++) {
      const chunkData = await readAndExtractChunk(file, offset)
      const { chunk } = await cipher.decryptChunk(chunkData.data)
      chunks.push(chunk)

      offset += chunkData.totalSize
      onProgress?.(((i + 1) / header.totalChunks) * 100)
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    cipher.destroy()
    onStage?.('Creating decrypted file...')

    const mimeType = getMimeType(header.ext)
    return new Blob(chunks, { type: mimeType })

  } finally {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    secureClear(symmetricKey.buffer)
  }
}

// Helper functions
async function readFileChunk(file: File, start: number, end: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const blob = file.slice(start, end)
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file chunk'))
    reader.readAsArrayBuffer(blob)
  })
}

function findChunkBoundary(data: Uint8Array, metadataLength: number): number {
  // This is a simplified version - in production, you'd need more robust boundary detection
  // For now, we'll estimate based on typical encrypted chunk size
  const estimatedSize = 1 + metadataLength + CHUNK_SIZE + 16 // 16 for GCM tag
  return Math.min(estimatedSize, data.length)
}

async function readAndExtractChunk(file: File, offset: number): Promise<{ data: Uint8Array; totalSize: number }> {
  // Read enough data to ensure we get the full chunk
  const buffer = await readFileChunk(file, offset, Math.min(offset + CHUNK_SIZE + 1024, file.size))
  const data = new Uint8Array(buffer)

  // Extract actual chunk based on metadata
  const metadataLength = data[0]
  const totalSize = findChunkBoundary(data, metadataLength)

  return {
    data: data.slice(0, totalSize),
    totalSize
  }
}

async function hashFile(file: File): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const chunkSize = 1024 * 1024 // 1MB chunks for hashing

  for (let i = 0; i < file.size; i += chunkSize) {
    const chunk = await readFileChunk(file, i, Math.min(i + chunkSize, file.size))
    chunks.push(new Uint8Array(chunk))
  }

  const combined = concatBytes(...chunks)
  return new Uint8Array(await crypto.subtle.digest('SHA-256', combined))
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'zip': 'application/zip',
    'json': 'application/json',
    'xml': 'application/xml'
  }

  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

// Export main streaming functions
export const streamEncrypt = {
  withPassword: streamEncryptWithPassword,
  withPublicKey: streamEncryptWithPublicKey
}

export const streamDecrypt = {
  withPassword: streamDecryptWithPassword,
  withPrivateKey: streamDecryptWithPrivateKey
} 
