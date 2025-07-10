export interface FileInfo {
  name: string
  size: number
  type: string
  encryptionMode?: 'public-key' | 'password' | 'unknown'
  originalExtension?: string
}

// export interface KeyPair {
//   publicKey: string
//   privateKey: string
// }

export interface PublicKey {
  publicKey: string
  note: string
  index?: number
}

export interface KeyPair {
  publicKey: string
  mnemonic?: string
  note: string
  index?: number
}

export type TabType = 'General' | 'Owner Keys' | 'Receiver Keys' | 'Security Password'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface CryptoState {
  inputType: 'file' | 'message'
  keyInput: string
  selectedFile: File | null
  textInput: string
  encryptedData: Blob | null
  textResult: string | null
  fileInfo: FileInfo | null
  isProcessing: boolean
  progress: number
  processMode: 'encrypt' | 'decrypt'
  isDragOver: boolean
  showKeyDropdown: boolean
  matchedKeys: (PublicKey | KeyPair)[]
  isKeyInputFocused: boolean
}
