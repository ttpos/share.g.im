/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import {
  deriveKeyPair,
  detect,
  isBase58String,
  isHexString,
  isMnemonicPhrase,
  validateBase58PublicKey,
  downloadFile
} from '@nsiod/share-utils'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { generateDownloadFilename } from '@/lib/utils'
import { CryptoState, PublicKey, KeyPair, FileInfo } from '@/types'

interface UseCryptoLogicProps {
  state: CryptoState
  updateState: (updates: Partial<CryptoState>) => void
  clearState: () => void
  freshPublicKeys: PublicKey[]
  freshKeyPairs: KeyPair[]
  refreshKeysFromStorage: () => Promise<void>
  workerRef: React.MutableRefObject<Worker | null>
  detectTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
}

export const useCryptoLogic = ({
  state,
  updateState,
  clearState,
  freshPublicKeys,
  freshKeyPairs,
  refreshKeysFromStorage,
  workerRef,
  detectTimeoutRef
}: UseCryptoLogicProps) => {
  const tMessages = useTranslations('messages')

  // Handle text input change with detection
  const handleTextInputChange = useCallback(async (value: string) => {
    updateState({ textInput: value })

    // Clear previous timeout
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current)
    }

    // Add debounce to avoid frequent detection calls
    detectTimeoutRef.current = setTimeout(async () => {
      if (value.trim()) {
        try {
          const metadata = await detect(value)

          if (metadata.encryptionType === 'pubk') {
            if (state.processMode !== 'decrypt') {
              updateState({ processMode: 'decrypt' })
              toast.info(tMessages('info.detectedPublicKeyEncryptedText'))
            }
          } else if (metadata.encryptionType === 'signed') {
            toast.error(tMessages('error.signedContentNotSupported'))
            updateState({ textInput: '' })
            return
          } else if (metadata.encryptionType === 'pwd') {
            toast.error(tMessages('error.passwordEncryptedNotSupported'))
            updateState({ textInput: '' })
            return
          } else {
            if (state.processMode !== 'encrypt') {
              updateState({ processMode: 'encrypt' })
              toast.info(tMessages('info.detectedUnencryptedText'))
            }
          }
        } catch (error) {
          console.error('Text detection failed:', error)
        }
      }
    }, 300)
  }, [state.processMode, tMessages, updateState, detectTimeoutRef])

  // Enhanced key input focus handler
  const handleKeyInputFocus = useCallback(() => {
    updateState({ isKeyInputFocused: true })
    refreshKeysFromStorage()

    if (state.processMode === 'encrypt') {
      updateState({
        matchedKeys: freshPublicKeys,
        showKeyDropdown: freshPublicKeys.length > 0
      })
    } else {
      updateState({
        matchedKeys: freshKeyPairs,
        showKeyDropdown: freshKeyPairs.length > 0
      })
    }
  }, [state.processMode, freshPublicKeys, freshKeyPairs, refreshKeysFromStorage, updateState])

  // Enhanced key input change handler
  const handleKeyInputChange = useCallback((value: string) => {
    updateState({ keyInput: value })

    if (!value.trim()) {
      if (state.processMode === 'encrypt') {
        updateState({
          matchedKeys: freshPublicKeys,
          showKeyDropdown: freshPublicKeys.length > 0 && state.isKeyInputFocused
        })
      } else {
        updateState({
          matchedKeys: freshKeyPairs,
          showKeyDropdown: freshKeyPairs.length > 0 && state.isKeyInputFocused
        })
      }
      return
    }

    const matches: (PublicKey | KeyPair)[] = []

    if (state.processMode === 'encrypt') {
      freshPublicKeys.forEach(key => {
        if (key.publicKey.toLowerCase().includes(value.toLowerCase()) ||
          key.note?.toLowerCase().includes(value.toLowerCase())) {
          matches.push(key)
        }
      })
    } else {
      freshKeyPairs.forEach(keyPair => {
        if (keyPair.mnemonic?.toLowerCase().includes(value.toLowerCase()) ||
          keyPair.publicKey.toLowerCase().includes(value.toLowerCase()) ||
          keyPair.note?.toLowerCase().includes(value.toLowerCase())) {
          matches.push(keyPair)
        }
      })
    }

    updateState({
      matchedKeys: matches,
      showKeyDropdown: matches.length > 0 && state.isKeyInputFocused
    })
  }, [state.processMode, state.isKeyInputFocused, freshPublicKeys, freshKeyPairs, updateState])

  // Handle key selection from dropdown
  const handleKeySelect = useCallback((selectedKey: PublicKey | KeyPair) => {
    if (state.processMode === 'encrypt') {
      updateState({ keyInput: selectedKey.publicKey })
    } else {
      if ('mnemonic' in selectedKey && selectedKey.mnemonic) {
        updateState({ keyInput: selectedKey.mnemonic })
      } else {
        updateState({ keyInput: selectedKey.publicKey })
      }
    }
    updateState({
      showKeyDropdown: false,
      isKeyInputFocused: false
    })
  }, [state.processMode, updateState])

  // Handle key input blur
  const handleKeyInputBlur = useCallback(() => {
    setTimeout(() => {
      updateState({
        isKeyInputFocused: false,
        showKeyDropdown: false
      })
    }, 200)
  }, [updateState])

  // Get matched public key for display
  const getMatchedPublicKey = useCallback(() => {
    if (state.processMode === 'decrypt' && state.keyInput) {
      const matchingKeyPair = freshKeyPairs.find(kp =>
        kp.mnemonic === state.keyInput || kp.publicKey === state.keyInput
      )
      return matchingKeyPair?.publicKey || null
    }
    return null
  }, [state.processMode, state.keyInput, freshKeyPairs])

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      updateState({
        selectedFile: file,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type || 'Unknown',
          encryptionMode: 'public-key'
        },
        textInput: '',
        inputType: 'file'
      })

      const metadata = await detect(file)

      if (metadata.encryptionType === 'pubk') {
        if (state.inputType !== 'file') {
          toast.info(tMessages('info.detectedPublicKeyEncryptedFile'))
        }
        updateState({
          processMode: file.name.endsWith('.enc') ? 'decrypt' : 'encrypt'
        })
      } else if (metadata.encryptionType === 'signed') {
        toast.error(tMessages('error.signedFilesNotSupported'))
        clearState()
        return
      } else {
        updateState({ processMode: 'encrypt' })
      }
    } catch (error) {
      console.error('File detection failed:', error)
      toast.error(tMessages('error.failedProcessFile'))
      clearState()
    }
  }, [state.inputType, tMessages, updateState, clearState])

  // Handle copy
  const handleCopy = useCallback(() => {
    if (state.textResult) {
      navigator.clipboard.writeText(state.textResult).then(() => {
        toast.success(tMessages('success.textCopied'))
      }).catch(() => {
        toast.error(tMessages('error.failedCopyText'))
      })
    }
  }, [state.textResult, tMessages])

  // Handle download
  const handleDownload = useCallback(() => {
    if (state.encryptedData) {
      const filename = generateDownloadFilename(state.inputType, state.fileInfo, state.processMode)
      downloadFile(state.encryptedData, filename)
      toast.success(tMessages(`success.${state.processMode === 'encrypt' ? 'fileEncrypted' : 'fileDecrypted'}`))
    }
  }, [state.encryptedData, state.inputType, state.fileInfo, state.processMode, tMessages])

  // Process input (encrypt/decrypt)
  const processInput = useCallback(async () => {
    if (state.inputType === 'file' && !state.selectedFile) {
      toast.error(tMessages('error.selectFile'))
      return
    }
    if (state.inputType === 'message' && !state.textInput) {
      toast.error(tMessages('error.enterText'))
      return
    }
    if (!state.keyInput) {
      toast.error(tMessages(`error.enter${state.processMode === 'encrypt' ? 'PublicKey' : 'PrivateKey'}`))
      return
    }

    updateState({ isProcessing: true, progress: 0 })

    try {
      let publicKey: string | undefined
      let privateKey: string | undefined
      const mode = state.processMode || 'encrypt'
      const _keyInput = state.keyInput.trim()

      if (mode === 'encrypt') {
        if (isBase58String(_keyInput)) {
          const validation = validateBase58PublicKey(_keyInput)
          if (!validation.isValid) {
            throw new Error(tMessages('error.invalidPublicKey'))
          }
          publicKey = _keyInput
        } else {
          throw new Error(tMessages('error.invalidPublicKey'))
        }
      } else {
        if (isHexString(_keyInput)) {
          if (_keyInput.length !== 64) {
            throw new Error(tMessages('error.invalidPrivateKey'))
          }
          privateKey = _keyInput
        } else if (isMnemonicPhrase(state.keyInput)) {
          privateKey = deriveKeyPair(state.keyInput).privateKey
        } else {
          throw new Error(tMessages('error.invalidPrivateKey'))
        }
      }

      const worker = workerRef.current
      if (!worker) throw new Error('Web Worker not initialized')

      const result = await new Promise<{
        data: Blob
        base64?: string
        filename: string
        originalExtension?: string
        signatureValid?: boolean
      }>((resolve, reject) => {
        const handleMessage = (e: MessageEvent) => {
          const { data, error, progress } = e.data
          if (error) {
            reject(new Error(error))
          } else if (progress !== undefined) {
            updateState({ progress: Math.round(progress) })
          } else if (data) {
            worker.removeEventListener('message', handleMessage)
            resolve(data)
          }
        }

        worker.addEventListener('message', handleMessage)

        worker.postMessage({
          mode,
          encryptionMode: 'pubk',
          file: state.inputType === 'file' ? state.selectedFile : undefined,
          filename: state.inputType === 'file' ? state.fileInfo?.name : undefined,
          text: state.inputType === 'message' ? state.textInput : undefined,
          publicKey,
          privateKey,
          isTextMode: state.inputType === 'message'
        })
      })

      if (state.inputType === 'file') {
        updateState({ encryptedData: result.data })
        if (mode === 'decrypt' && result.originalExtension) {
          updateState({
            fileInfo: state.fileInfo ? {
              ...state.fileInfo,
              originalExtension: result.originalExtension
            } : null
          })
        }
        if (result.base64) {
          updateState({
            textResult: result.base64,
            textInput: result.base64
          })
        }
        if (result.signatureValid !== undefined) {
          toast.info(tMessages(`info.signature${result.signatureValid ? 'Valid' : 'Invalid'}`))
        }
        toast.success(tMessages(`success.${mode === 'encrypt' ? 'fileEncrypted' : 'fileDecrypted'}`))
      } else {
        updateState({
          textResult: result.base64 || '',
          textInput: result.base64 || '',
          encryptedData: result.data
        })
        if (mode === 'decrypt' && result.signatureValid !== undefined) {
          toast.info(tMessages(`info.signature${result.signatureValid ? 'Valid' : 'Invalid'}`))
        }
        toast.success(tMessages(`success.${mode === 'encrypt' ? 'textEncrypted' : 'textDecrypted'}`))
      }

      setTimeout(() => {
        updateState({ progress: 0 })
      }, 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tMessages('error.failedProcessFile'))
    } finally {
      updateState({ isProcessing: false })
    }
  }, [state, tMessages, updateState, workerRef])

  return {
    handleTextInputChange,
    handleKeyInputFocus,
    handleKeyInputChange,
    handleKeySelect,
    handleKeyInputBlur,
    getMatchedPublicKey,
    handleFileSelect,
    handleCopy,
    handleDownload,
    processInput
  }
}
