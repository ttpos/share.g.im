/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

import { secureStorage } from '@/lib/encryption'

export const useSecureLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const loadData = async () => {
      try {
        const storedValue = await secureStorage.getItem(key, initialValue)
        setValue(storedValue)
      } catch (error) {
        console.error('Error loading data from storage:', error)
        // Use initial value on error
        setValue(initialValue)
        toast.error('Failed to load data from storage')
      } finally {
        setIsLoaded(true)
      }
    }

    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      // Handle function updates
      const resolvedValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value) 
        : newValue

      // Update state immediately (synchronous)
      setValue(resolvedValue)
      
      // Save to storage asynchronously (don't await)
      secureStorage.setItem(key, resolvedValue).catch(() => {
        toast.error('Failed to save data to storage')
      })
    } catch (error) {
      console.error('Error setting value in storage:', error)
      toast.error('Failed to update data')
    }
  }, [key, value])

  const removeStoredValue = useCallback(() => {
    try {
      setValue(initialValue)
      secureStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing value from storage:', error)
      toast.error('Failed to remove data')
    }
  }, [key, initialValue])

  return [value, setStoredValue, removeStoredValue, isLoaded] as const
}
