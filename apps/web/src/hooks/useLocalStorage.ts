import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setValue(JSON.parse(stored))
      }
      setIsLoaded(true)
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error)
      toast.error('Failed to load data from storage')
      setIsLoaded(true)
    }
  }, [key])

  const setStoredValue = useCallback((newValue: T) => {
    try {
      setValue(newValue)
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error)
      toast.error('Failed to save data to storage')
    }
  }, [key])

  const removeStoredValue = useCallback(() => {
    try {
      setValue(initialValue)
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error)
      toast.error('Failed to remove data from storage')
    }
  }, [key, initialValue])

  return [value, setStoredValue, removeStoredValue, isLoaded] as const
}
