export interface FileInfo {
  name: string
  size: number
  type: string
  encryptionMode?: 'public-key' | 'password' | 'unknown'
  originalExtension?: string
}

export interface KeyPair {
  publicKey: string
  privateKey: string
}
