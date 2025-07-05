import { hashPasswordFn } from '@ttpos/share-utils'

// Fixed password for client storage encryption
const STORAGE_PASSWORD = 'TTPOS_SECURE_VAULT_2024_STORAGE_KEY'

// Simple XOR encryption using hashed password as key
const xorEncrypt = (data: string, key: string): string => {
  let result = ''
  for (let i = 0; i < data.length; i++) {
    const keyChar = key.charCodeAt(i % key.length)
    const dataChar = data.charCodeAt(i)
    result += String.fromCharCode(dataChar ^ keyChar)
  }
  return btoa(result) // Base64 encode
}

const xorDecrypt = (encryptedData: string, key: string): string => {
  try {
    const data = atob(encryptedData) // Base64 decode
    let result = ''
    for (let i = 0; i < data.length; i++) {
      const keyChar = key.charCodeAt(i % key.length)
      const dataChar = data.charCodeAt(i)
      result += String.fromCharCode(dataChar ^ keyChar)
    }
    return result
  } catch (error) {
    throw new Error('Failed to decrypt data')
  }
}

// Get encryption key from fixed password
let cachedEncryptionKey: string | null = null

const getEncryptionKey = async (): Promise<string> => {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey
  }
  
  try {
    // Use hashPasswordFn to create a consistent encryption key
    cachedEncryptionKey = await hashPasswordFn(STORAGE_PASSWORD)
    return cachedEncryptionKey
  } catch (error) {
    console.error('Failed to generate encryption key:', error)
    throw new Error('Failed to generate encryption key')
  }
}

// Encrypt data for localStorage
export const encryptForStorage = async (data: string): Promise<string> => {
  try {
    const encryptionKey = await getEncryptionKey()
    return xorEncrypt(data, encryptionKey)
  } catch (error) {
    console.error('Storage encryption failed:', error)
    throw new Error('Failed to encrypt data for storage')
  }
}

// Decrypt data from localStorage
export const decryptFromStorage = async (encryptedData: string): Promise<string> => {
  try {
    const encryptionKey = await getEncryptionKey()
    return xorDecrypt(encryptedData, encryptionKey)
  } catch (error) {
    console.error('Storage decryption failed:', error)
    throw new Error('Failed to decrypt data from storage')
  }
}

// Enhanced localStorage utilities with encryption
export const secureStorage = {
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      const serializedValue = JSON.stringify(value)
      const encryptedValue = await encryptForStorage(serializedValue)
      localStorage.setItem(key, encryptedValue)
    } catch (error) {
      console.error(`Failed to securely store ${key}:`, error)
      throw new Error(`Failed to store ${key}`)
    }
  },

  getItem: async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      const encryptedValue = localStorage.getItem(key)
      if (!encryptedValue) {
        return defaultValue
      }
      
      const decryptedValue = await decryptFromStorage(encryptedValue)
      return JSON.parse(decryptedValue) as T
    } catch (error) {
      console.error(`Failed to securely retrieve ${key}:`, error)
      // Return default value if decryption fails (might be old unencrypted data)
      return defaultValue
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
      throw new Error(`Failed to remove ${key}`)
    }
  },

  // Check if stored data exists and is valid
  hasValidItem: async (key: string): Promise<boolean> => {
    try {
      const encryptedValue = localStorage.getItem(key)
      if (!encryptedValue) return false
      
      // Try to decrypt to validate
      await decryptFromStorage(encryptedValue)
      return true
    } catch {
      return false
    }
  }
}
