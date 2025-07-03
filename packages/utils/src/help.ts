import { base58 } from '@scure/base'
import { HDKey } from '@scure/bip32'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { bytesToUtf8 } from '@noble/ciphers/utils'

// Default derivation path for key generation
// eslint-disable-next-line quotes
export const DEFAULT_DERIVATION_PATH = "m/44'/0'/0'/0/0"

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Read file as ArrayBuffer
const readFileAsArrayBuffer = (file: File | Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

// Identify encryption mode from file
export const identifyEncryptionMode = async (file: File): Promise<'pubk' | 'pwd' | 'unknown'> => {
  try {
    const buffer = await readFileAsArrayBuffer(file.slice(0, 3))
    const data = new Uint8Array(buffer)
    const magicBytes = bytesToUtf8(data)
    if (magicBytes === 'ns0' || magicBytes === 'ns2') {
      return 'pubk'
    } else if (magicBytes === 'ns1') {
      return 'pwd'
    }
    return 'unknown'
  } catch (error) {
    console.error('Error identifying encryption mode:', error)
    return 'unknown'
  }
}

export const isBase58String = (input: string): boolean => {
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(input)
}

export const isHexString = (input: string): boolean => {
  return /^[0-9a-fA-F]+$/.test(input)
}

export const isMnemonicPhrase = (input: string): boolean => {
  return input.split(' ').length >= 12
}

// Derive key pair from mnemonic phrase
export const deriveKeyPair = (mnemonic: string) => {
  if (!bip39.validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic phrase')
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const masterNode = HDKey.fromMasterSeed(seed)
  const key = masterNode.derive(DEFAULT_DERIVATION_PATH)
  if (!key.privateKey || !key.publicKey) {
    throw new Error('Failed to derive key pair')
  }
  return {
    privateKey: Buffer.from(key.privateKey).toString('hex'),
    publicKey: base58.encode(key.publicKey)
  }
}

/**
 * Validates a Base58 encoded public key
 * @param key - Base58 encoded public key string
 * @returns Validation result containing validity status, error message, and decoded bytes
 */
export function validateBase58PublicKey(key: string): {
  isValid: boolean
  error?: string
  pubKeyBytes?: Uint8Array
} {
  // Input validation
  if (!key || typeof key !== 'string') {
    return { isValid: false, error: 'Public key must be a non-empty string' }
  }

  // Trim whitespace
  const trimmedKey = key.trim()
  if (!trimmedKey) {
    return { isValid: false, error: 'Public key cannot be empty or whitespace only' }
  }

  // Check length range (Base58 encoded 33 bytes typically 44-50 characters)
  if (trimmedKey.length < 40 || trimmedKey.length > 60) {
    return { isValid: false, error: 'Invalid public key length. Expected Base58 encoded string length between 40-60 characters' }
  }

  // Check if it matches Base58 character set (Bitcoin Base58 charset)
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmedKey)) {
    return { isValid: false, error: 'Invalid public key format. Must contain only Base58 characters (excluding 0, O, I, l)' }
  }

  try {
    const pubKeyBytes = base58.decode(trimmedKey)

    // Check decoded length
    // 33 bytes: compressed format public key
    // 65 bytes: uncompressed format public key  
    if (pubKeyBytes.length !== 33 && pubKeyBytes.length !== 65) {
      return {
        isValid: false,
        error: `Invalid public key length. Expected 33 bytes (compressed) or 65 bytes (uncompressed), got ${pubKeyBytes.length} bytes`
      }
    }

    // Validate compressed format public key prefix
    if (pubKeyBytes.length === 33) {
      const prefix = pubKeyBytes[0]
      if (prefix !== 0x02 && prefix !== 0x03) {
        return {
          isValid: false,
          error: 'Invalid compressed public key prefix. Must start with 0x02 or 0x03'
        }
      }
    }

    // Validate uncompressed format public key prefix
    if (pubKeyBytes.length === 65) {
      const prefix = pubKeyBytes[0]
      if (prefix !== 0x04) {
        return {
          isValid: false,
          error: 'Invalid uncompressed public key prefix. Must start with 0x04'
        }
      }
    }

    return { isValid: true, pubKeyBytes }
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to decode Base58 public key: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Slices an pubk address to a shorter format
 * @param address - The pubk address to slice
 * @param startLength - Number of characters to keep at the start
 * @param endLength - Number of characters to keep at the end
 * @returns The sliced address in the format "start...end"
 */
export const sliceAddress = (
  address?: `0x${string}` | string,
  startLength: number = 3,
  endLength: number = 4
) => {
  if (!address) return ''

  if (address.length <= startLength + endLength) {
    return address
  }

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

