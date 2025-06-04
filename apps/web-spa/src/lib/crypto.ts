import { gcm } from '@noble/ciphers/aes'
import { bytesToUtf8, concatBytes, utf8ToBytes } from '@noble/ciphers/utils'
import { managedNonce, randomBytes } from '@noble/ciphers/webcrypto'
import { secp256k1 } from '@noble/curves/secp256k1'
import { argon2id } from '@noble/hashes/argon2'
import { sha256 } from '@noble/hashes/sha2.js'
import * as ecies from 'eciesjs'

const argonOpts = { t: 2, m: 60, p: 1, maxmem: 2 ** 32 - 1 }

interface EncryptArgs {
  data: string | Uint8Array
  sender?: { privKeyBytes: Uint8Array }
  receiver?: Uint8Array
  password?: string
  ext?: string
}

interface DecryptArgs {
  data: Uint8Array
  sender?: Uint8Array
  receiver?: Uint8Array
  password?: string
}

interface HeaderInfo {
  ext: string
  signature?: Uint8Array
  key?: Uint8Array
  length: number
}

interface DecryptResult {
  payload: Uint8Array
  ext: string
  isValid?: boolean
}

// Helper function to create a single byte
function getByte(num: number): Uint8Array {
  if (num < 0 || num > 255) num = 0
  return new Uint8Array([num & 0xff])
}

// Encrypt data using either ECIES or password-based AES-GCM
export function encrypt(args: EncryptArgs): Uint8Array {
  const { data, sender, receiver, password, ext = 'txt' } = args

  if (!data || (!receiver && !password)) {
    throw new Error('Data and at least one of receiver or password are required')
  }

  const mode = receiver ? 0 : 1
  const meta = concatBytes(utf8ToBytes('ns'), getByte(mode))
  const dataBytes = typeof data === 'string' ? utf8ToBytes(data) : data

  if (receiver) return encryptEcies(dataBytes, sender, receiver, ext, meta)
  if (password) return encryptPwd(dataBytes, password, ext, meta)

  throw new Error('Invalid encryption parameters')
}

// Password-based encryption using AES-GCM
function encryptPwd(data: Uint8Array, password: string, ext: string, meta: Uint8Array): Uint8Array {
  const salt = randomBytes(16)
  const key = argon2id(password, salt, argonOpts)

  const header = concatBytes(getByte(ext.length), utf8ToBytes(ext), getByte(0))
  const aes = managedNonce(gcm)(key)
  const encodeHeader = aes.encrypt(header)
  const encodeData = aes.encrypt(data)

  return concatBytes(meta, getByte(encodeHeader.length + 16), salt, encodeHeader, encodeData)
}

// ECIES-based encryption
function encryptEcies(data: Uint8Array, sender: { privKeyBytes: Uint8Array } | undefined, receiver: Uint8Array, ext: string, meta: Uint8Array): Uint8Array {
  const isSign = sender ? 1 : 0
  let header = concatBytes(getByte(ext.length), utf8ToBytes(ext), getByte(isSign))

  if (isSign === 1) {
    const msgHash = sha256(data)
    const sig = secp256k1.sign(msgHash, sender!.privKeyBytes)
    const signature = sig.toCompactRawBytes()
    header = concatBytes(header, signature)
  }

  const encodeHeader = ecies.encrypt(receiver, header)
  const encodeData = ecies.encrypt(receiver, data)

  return concatBytes(meta, getByte(encodeHeader.length), encodeHeader, encodeData)
}

// Validate and parse encrypted data header
export function checkDecryptHeader(args: DecryptArgs): HeaderInfo {
  const { data, receiver, password } = args
  const srv = bytesToUtf8(data.slice(0, 2))
  const mode = data.slice(2, 3)[0]

  if (!data || (!receiver && !password)) {
    throw new Error('Data and at least one of receiver or password are required')
  }
  if (srv !== 'ns') {
    throw new Error('Data is not encrypted')
  }
  if (mode !== 0 && mode !== 1) {
    throw new Error('Encryption mode is not supported')
  }
  if (mode === 1 && !password) {
    throw new Error('Password mode requires a password')
  }
  if (mode === 0 && !receiver) {
    throw new Error('Public-key mode requires a receiver')
  }

  const headerLength = data.slice(3, 4)[0]
  const encryptHeader = data.slice(4, 4 + headerLength)

  if (receiver) {
    const attr = Uint8Array.from(ecies.decrypt(receiver, encryptHeader))
    const extLength = attr.slice(0, 1)[0]
    const ext = bytesToUtf8(attr.slice(1, 1 + extLength))
    const isSign = attr.slice(1 + extLength, 2 + extLength)[0]
    let signature: Uint8Array | undefined
    if (isSign === 1) {
      signature = attr.slice(2 + extLength, attr.length)
    }
    return { ext, signature, length: 4 + headerLength }
  }

  if (password) {
    const salt = data.slice(4, 20)
    const encryptHeader = data.slice(20, 4 + headerLength)
    const key = argon2id(password, salt, argonOpts)
    const aes = managedNonce(gcm)(key)
    const header = Uint8Array.from(aes.decrypt(encryptHeader))
    const extLength = header.slice(0, 1)[0]
    const ext = bytesToUtf8(header.slice(1, 1 + extLength))
    return { ext, key, length: 4 + headerLength }
  }

  throw new Error('Invalid decryption parameters')
}

// Decrypt data using either ECIES or password-based AES-GCM
export function decrypt(args: DecryptArgs): DecryptResult {
  const { data, sender, receiver, password } = args
  const header = checkDecryptHeader(args)

  if (receiver) return decryptEcies(data, sender, receiver, header)
  if (password) return decryptPwd(data, header)

  throw new Error('Invalid decryption parameters')
}

// Password-based decryption
function decryptPwd(data: Uint8Array, header: HeaderInfo): DecryptResult {
  const aes = managedNonce(gcm)(header.key!)
  const payload = aes.decrypt(data.slice(header.length, data.length))
  return { payload, ext: header.ext }
}

// ECIES-based decryption
function decryptEcies(data: Uint8Array, sender: Uint8Array | undefined, receiver: Uint8Array, header: HeaderInfo): DecryptResult {
  let isValid = false
  const payload = ecies.decrypt(receiver, data.slice(header.length, data.length))

  if (header.signature && sender) {
    try {
      const msgHash = sha256(payload)
      const sig = secp256k1.Signature.fromCompact(header.signature)
      isValid = secp256k1.verify(sig, msgHash, sender)
    } catch (e) {
      isValid = false
    }
  }

  return { payload, ext: header.ext, isValid }
}
