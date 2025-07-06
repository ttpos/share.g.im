// Check if string is valid Base64
const isBase64 = (str: string): boolean => {
  if (!str || str.length === 0) return false
  
  // Basic Base64 pattern check
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  if (!base64Regex.test(str)) return false
  
  // Check if length is valid for Base64 (must be multiple of 4)
  if (str.length % 4 !== 0) return false
  
  try {
    atob(str)
    return true
  } catch {
    return false
  }
}

// Simple Base64 encode for storage
const encodeForStorage = (data: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(data)))
  } catch (error) {
    console.error('Encoding error:', error)
    throw new Error('Failed to encode data for storage')
  }
}

// Simple Base64 decode from storage
const decodeFromStorage = (encodedData: string): string => {
  try {
    return decodeURIComponent(escape(atob(encodedData)))
  } catch (error) {
    console.error('Decoding error:', error)
    throw new Error('Failed to decode data from storage')
  }
}

// Enhanced localStorage utilities with Base64 encoding
export const secureStorage = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      const serializedValue = JSON.stringify(value)
      const encodedValue = encodeForStorage(serializedValue)
      localStorage.setItem(key, encodedValue)
    } catch (error) {
      console.error('Storage error:', error)
      throw new Error(`Failed to store ${key}`)
    }
  },

  getItem: async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      const storedValue = localStorage.getItem(key)
      if (!storedValue) {
        return defaultValue
      }
      
      // Check if it looks like Base64 encoded data
      if (isBase64(storedValue)) {
        try {
          const decodedValue = decodeFromStorage(storedValue)
          return JSON.parse(decodedValue) as T
        } catch {
          // If decoding fails, treat as corrupted and use default
          return defaultValue
        }
      } else {
        // Data doesn't look encoded, try parsing as old unencrypted JSON
        try {
          const parsedValue = JSON.parse(storedValue) as T
          // Successfully parsed old data, now encode and save it
          await secureStorage.setItem(key, parsedValue)
          return parsedValue
        } catch {
          // Failed to parse, use default value
          return defaultValue
        }
      }
    } catch {
      return defaultValue
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage error:', error)
      throw new Error(`Failed to remove ${key}`)
    }
  },

  // Check if stored data exists and is valid
  hasValidItem: async (key: string): Promise<boolean> => {
    try {
      const storedValue = localStorage.getItem(key)
      if (!storedValue) return false
      
      // Check if it's valid Base64 encoded data
      if (isBase64(storedValue)) {
        try {
          decodeFromStorage(storedValue)
          return true
        } catch {
          return false
        }
      } else {
        // Check if it's valid unencrypted JSON
        try {
          JSON.parse(storedValue)
          return true
        } catch {
          return false
        }
      }
    } catch {
      return false
    }
  },

  // Clear all corrupted data (utility function)
  clearCorruptedData: (keys: string[]): void => {
    keys.forEach(key => {
      try {
        const storedValue = localStorage.getItem(key)
        if (storedValue && isBase64(storedValue)) {
          try {
            decodeFromStorage(storedValue)
          } catch {
            localStorage.removeItem(key)
          }
        }
      } catch {
        // Silently ignore errors during cleanup
      }
    })
  }
}
