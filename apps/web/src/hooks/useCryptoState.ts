import { useState, useRef, useCallback, useEffect } from 'react'

import { STORAGE_KEYS } from '@/constants'
import { useSecureLocalStorage } from '@/hooks'
import { secureStorage } from '@/lib/encryption'
import { CryptoState, PublicKey, KeyPair } from '@/types'

export const useCryptoState = () => {
  const [state, setState] = useState<CryptoState>({
    inputType: 'file',
    keyInput: '',
    selectedFile: null,
    textInput: '',
    encryptedData: null,
    textResult: null,
    fileInfo: null,
    isProcessing: false,
    progress: 0,
    processMode: 'encrypt',
    isDragOver: false,
    showKeyDropdown: false,
    matchedKeys: [],
    isKeyInputFocused: false
  })

  const workerRef = useRef<Worker | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)
  const detectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load stored keys
  const [publicKeys, , , isPublicKeysLoaded] = useSecureLocalStorage<PublicKey[]>(STORAGE_KEYS.PUBLIC_KEYS, [])
  const [keyPairs, , , isKeyPairsLoaded] = useSecureLocalStorage<KeyPair[]>(STORAGE_KEYS.KEY_PAIRS, [])

  // Fresh keys state for real-time updates
  const [freshPublicKeys, setFreshPublicKeys] = useState<PublicKey[]>([])
  const [freshKeyPairs, setFreshKeyPairs] = useState<KeyPair[]>([])

  const updateState = (updates: Partial<CryptoState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const clearState = useCallback(() => {
    setState({
      inputType: state.inputType,
      keyInput: '',
      selectedFile: null,
      textInput: '',
      encryptedData: null,
      textResult: null,
      fileInfo: null,
      isProcessing: false,
      progress: 0,
      processMode: 'encrypt',
      isDragOver: false,
      showKeyDropdown: false,
      matchedKeys: [],
      isKeyInputFocused: false
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current)
    }
  }, [state.inputType])

  // Refresh keys from storage
  const refreshKeysFromStorage = async () => {
    try {
      const freshPubKeys = await secureStorage.getItem(STORAGE_KEYS.PUBLIC_KEYS, [])
      const freshKeyPairsData = await secureStorage.getItem(STORAGE_KEYS.KEY_PAIRS, [])
      setFreshPublicKeys(freshPubKeys)
      setFreshKeyPairs(freshKeyPairsData)
    } catch (error) {
      console.error('Failed to refresh keys:', error)
    }
  }

  // Initial load and periodic refresh
  useEffect(() => {
    if (isPublicKeysLoaded && isKeyPairsLoaded) {
      setFreshPublicKeys(publicKeys)
      setFreshKeyPairs(keyPairs)
    }
  }, [publicKeys, keyPairs, isPublicKeysLoaded, isKeyPairsLoaded])

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('@/workers/cryptoWorker.ts', import.meta.url))
    return () => workerRef.current?.terminate()
  }, [])

  return {
    state,
    updateState,
    clearState,
    freshPublicKeys,
    freshKeyPairs,
    refreshKeysFromStorage,
    workerRef,
    fileInputRef,
    keyInputRef,
    detectTimeoutRef
  }
}
