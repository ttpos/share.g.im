'use client'

import {
  Button,
  Label,
  Input,
  PasswordInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn
} from '@nsiod/share-ui'
import {
  deriveKeyPair,
  detect,
  formatFileSize,
  isBase58String,
  isHexString,
  isMnemonicPhrase,
  validateBase58PublicKey,
  downloadFile
} from '@nsiod/share-utils'
import { Download, RefreshCw, X, Copy, Eye, ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'
import { Locale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect, useCallback, use } from 'react'
import { toast } from 'sonner'

import HowItWorksSection from '@/components/HowItWorksSection'
import TextInputArea from '@/components/TextInputArea'
import { STORAGE_KEYS } from '@/constants'
import { useSecureLocalStorage } from '@/hooks'
import { secureStorage } from '@/lib/encryption'
import { generateDownloadFilename } from '@/lib/utils'
import { FileInfo, PublicKey, KeyPair } from '@/types'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default function HomePage({ params }: Props) {
  const { locale } = use(params)

  const tNavigation = useTranslations('navigation')
  const tUpload = useTranslations('upload')
  const tInput = useTranslations('input')
  const tButtons = useTranslations('buttons')
  const tMessages = useTranslations('messages')

  const [inputType, setInputType] = useState<'file' | 'message'>('message')
  const [keyInput, setKeyInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [encryptedData, setEncryptedData] = useState<Blob | null>(null)
  const [textResult, setTextResult] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processMode, setProcessMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [isDragOver, setIsDragOver] = useState(false)

  // Key matching states
  const [showKeyDropdown, setShowKeyDropdown] = useState(false)
  const [matchedKeys, setMatchedKeys] = useState<(PublicKey | KeyPair)[]>([])
  const [isKeyInputFocused, setIsKeyInputFocused] = useState(false)

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

  // Refresh keys from storage
  const refreshKeysFromStorage = useCallback(async () => {
    try {
      const freshPubKeys = await secureStorage.getItem(STORAGE_KEYS.PUBLIC_KEYS, [])
      const freshKeyPairsData = await secureStorage.getItem(STORAGE_KEYS.KEY_PAIRS, [])
      setFreshPublicKeys(freshPubKeys)
      setFreshKeyPairs(freshKeyPairsData)
    } catch (error) {
      console.error('Failed to refresh keys:', error)
    }
  }, [])

  // Initial load and periodic refresh
  useEffect(() => {
    if (isPublicKeysLoaded && isKeyPairsLoaded) {
      setFreshPublicKeys(publicKeys)
      setFreshKeyPairs(keyPairs)
    }
  }, [publicKeys, keyPairs, isPublicKeysLoaded, isKeyPairsLoaded])

  // Refresh when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshKeysFromStorage()
      }
    }

    const handleFocus = () => {
      refreshKeysFromStorage()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshKeysFromStorage])

  // Handle text input change with detection
  const handleTextInputChange = useCallback(async (value: string) => {
    setTextInput(value)

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
            // Detected public key encrypted text, switch to decrypt mode
            if (processMode !== 'decrypt') {
              setProcessMode('decrypt')
              toast.info(tMessages('info.detectedPublicKeyEncryptedText'))
            }
          } else if (metadata.encryptionType === 'signed') {
            toast.error(tMessages('error.signedContentNotSupported'))
            setTextInput('')
            return
          } else if (metadata.encryptionType === 'pwd') {
            toast.error(tMessages('error.passwordEncryptedNotSupported'))
            setTextInput('')
            return
          } else {
            if (processMode !== 'encrypt') {
              setProcessMode('encrypt')
              toast.info(tMessages('info.detectedUnencryptedText'))
            }
          }
          // For unencrypted text, keep current mode (don't auto-switch to encrypt)
        } catch (error) {
          console.error('Text detection failed:', error)
          // On detection failure, don't change mode
        }
      }
    }, 300)
  }, [processMode, tMessages])

  // Enhanced key input focus handler - show all available keys
  const handleKeyInputFocus = useCallback(() => {
    setIsKeyInputFocused(true)
    // Refresh keys when user focuses input
    refreshKeysFromStorage()

    // Show all available keys on focus
    if (processMode === 'encrypt') {
      // Encrypt mode: show all public keys
      setMatchedKeys(freshPublicKeys)
      setShowKeyDropdown(freshPublicKeys.length > 0)
    } else {
      // Decrypt mode: show all key pairs
      setMatchedKeys(freshKeyPairs)
      setShowKeyDropdown(freshKeyPairs.length > 0)
    }
  }, [processMode, freshPublicKeys, freshKeyPairs, refreshKeysFromStorage])

  useEffect(() => {
    workerRef.current = new Worker(new URL('@/workers/cryptoWorker.ts', import.meta.url))
    return () => workerRef.current?.terminate()
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '')
      if (hash.startsWith('pub/')) {
        const pubKey = hash.substring(4)
        if (pubKey && isBase58String(pubKey)) {
          const validation = validateBase58PublicKey(pubKey)
          if (validation.isValid) {
            if (processMode === 'encrypt') {
              setKeyInput(pubKey)
            } else {
              // For decrypt mode, find matching key pair and use mnemonic/private key
              const matchingKeyPair = keyPairs.find(kp => kp.publicKey === pubKey)
              if (matchingKeyPair) {
                if (matchingKeyPair.mnemonic) {
                  setKeyInput(matchingKeyPair.mnemonic)
                } else {
                  // If no mnemonic, we'd need the private key (not stored in our current structure)
                  setKeyInput(pubKey) // Fallback to public key
                }
              } else {
                setKeyInput('')
                toast.info(tMessages('error.noMatchingPrivateKey'))
              }
            }
          } else {
            setKeyInput('')
          }
        } else {
          setKeyInput('')
        }
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [processMode, keyPairs, tMessages])

  // Enhanced key input change handler with better empty state handling
  const handleKeyInputChange = useCallback((value: string) => {
    setKeyInput(value)

    // If no input, show all available keys when focused
    if (!value.trim()) {
      if (processMode === 'encrypt') {
        setMatchedKeys(freshPublicKeys)
        setShowKeyDropdown(freshPublicKeys.length > 0 && isKeyInputFocused)
      } else {
        setMatchedKeys(freshKeyPairs)
        setShowKeyDropdown(freshKeyPairs.length > 0 && isKeyInputFocused)
      }
      return
    }

    // Filter matching keys based on input
    const matches: (PublicKey | KeyPair)[] = []

    if (processMode === 'encrypt') {
      // For encryption: only match External Public Keys
      freshPublicKeys.forEach(key => {
        if (key.publicKey.toLowerCase().includes(value.toLowerCase()) ||
          key.note?.toLowerCase().includes(value.toLowerCase())) {
          matches.push(key)
        }
      })
    } else {
      // For decryption: only match Keys (key pairs with private keys/mnemonics)
      freshKeyPairs.forEach(keyPair => {
        if (keyPair.mnemonic?.toLowerCase().includes(value.toLowerCase()) ||
          keyPair.publicKey.toLowerCase().includes(value.toLowerCase()) ||
          keyPair.note?.toLowerCase().includes(value.toLowerCase())) {
          matches.push(keyPair)
        }
      })
    }

    setMatchedKeys(matches)
    setShowKeyDropdown(matches.length > 0 && isKeyInputFocused)
  }, [processMode, freshPublicKeys, freshKeyPairs, isKeyInputFocused])

  // Handle key selection from dropdown
  const handleKeySelect = useCallback((selectedKey: PublicKey | KeyPair) => {
    if (processMode === 'encrypt') {
      setKeyInput(selectedKey.publicKey)
    } else {
      // For decryption, use mnemonic if available, otherwise publicKey
      if ('mnemonic' in selectedKey && selectedKey.mnemonic) {
        setKeyInput(selectedKey.mnemonic)
      } else {
        setKeyInput(selectedKey.publicKey)
      }
    }
    setShowKeyDropdown(false)
    setIsKeyInputFocused(false)
    keyInputRef.current?.blur()
  }, [processMode])

  // Handle key input blur
  const handleKeyInputBlur = useCallback(() => {
    // Delay hiding dropdown to allow click on items
    setTimeout(() => {
      setIsKeyInputFocused(false)
      setShowKeyDropdown(false)
    }, 200)
  }, [])

  // Get secondary display text (note or public key)
  const getKeySecondaryText = useCallback((key: PublicKey | KeyPair) => {
    if (processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic) {
      // For decryption with mnemonic, show public key as secondary
      return key.publicKey
    }
    // For encryption or when no mnemonic, show note as secondary
    return key.note || ''
  }, [processMode])

  // Get matched public key for display (when in decrypt mode)
  const getMatchedPublicKey = useCallback(() => {
    if (processMode === 'decrypt' && keyInput) {
      // Find the matching key pair by mnemonic or private key
      const matchingKeyPair = freshKeyPairs.find(kp =>
        kp.mnemonic === keyInput || kp.publicKey === keyInput
      )
      return matchingKeyPair?.publicKey || null
    }
    return null
  }, [processMode, keyInput, freshKeyPairs])

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setSelectedFile(file)
        setFileInfo({
          name: file.name,
          size: file.size,
          type: file.type || 'Unknown',
          encryptionMode: 'public-key'
        })
        setTextInput('')
        setInputType('file')
        const metadata = await detect(file)

        if (metadata.encryptionType === 'pubk') {
          if (inputType !== 'file') {
            toast.info(tMessages('info.detectedPublicKeyEncryptedFile'))
            setInputType('file')
          }
          setProcessMode(file.name.endsWith('.enc') ? 'decrypt' : 'encrypt')
        } else if (metadata.encryptionType === 'signed') {
          toast.error(tMessages('error.signedFilesNotSupported'))
          clearState()
          return
        } else {
          setProcessMode('encrypt')
        }
      } catch (error) {
        console.error('File detection failed:', error)
        toast.error(tMessages('error.failedProcessFile'))
        clearState()
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      if (files.length > 1) {
        toast.error(tMessages('error.multipleFilesNotSupported'))
        return
      }

      const file = files[0]
      try {
        if (file) {
          setSelectedFile(file)
          setFileInfo({
            name: file.name,
            size: file.size,
            type: file.type || 'Unknown',
            encryptionMode: 'public-key'
          })
          setTextInput('')
          setInputType('file')
          const metadata = await detect(file)

          if (metadata.encryptionType === 'pubk') {
            if (inputType !== 'file') {
              toast.info(tMessages('info.detectedPublicKeyEncryptedFile'))
              setInputType('file')
            }
            setProcessMode(file.name.endsWith('.enc') ? 'decrypt' : 'encrypt')
          } else if (metadata.encryptionType === 'signed') {
            toast.error(tMessages('error.signedFilesNotSupported'))
            clearState()
            return
          } else {
            setProcessMode('encrypt')
          }
        }
      } catch (error) {
        console.error('File detection failed:', error)
        toast.error(tMessages('error.failedProcessFile'))
        clearState()
      }
    }
  }

  const handleDownload = useCallback(() => {
    if (encryptedData) {
      const filename = generateDownloadFilename(inputType, fileInfo, processMode)
      downloadFile(encryptedData, filename)
      toast.success(tMessages(`success.${processMode === 'encrypt' ? 'fileEncrypted' : 'fileDecrypted'}`))
    }
  }, [encryptedData, inputType, fileInfo, processMode, tMessages])

  const handleCopy = () => {
    if (textResult) {
      navigator.clipboard.writeText(textResult).then(() => {
        toast.success(tMessages('success.textCopied'))
      }).catch(() => {
        toast.error(tMessages('error.failedCopyText'))
      })
    }
  }

  const clearState = () => {
    setKeyInput('')
    setFileInfo(null)
    setEncryptedData(null)
    setTextResult(null)
    setIsProcessing(false)
    setSelectedFile(null)
    setTextInput('')
    setIsDragOver(false)
    setShowKeyDropdown(false)
    setMatchedKeys([])
    setIsKeyInputFocused(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current)
    }
  }

  const processInput = async () => {
    if (inputType === 'file' && !selectedFile) {
      toast.error(tMessages('error.selectFile'))
      return
    }
    if (inputType === 'message' && !textInput) {
      toast.error(tMessages('error.enterText'))
      return
    }
    if (!keyInput) {
      toast.error(tMessages(`error.enter${processMode === 'encrypt' ? 'PublicKey' : 'PrivateKey'}`))
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      let publicKey: string | undefined
      let privateKey: string | undefined
      const mode = processMode || 'encrypt'
      const _keyInput = keyInput.trim()

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
        } else if (isMnemonicPhrase(keyInput)) {
          privateKey = deriveKeyPair(keyInput).privateKey
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
            setProgress(Math.round(progress))
          } else if (data) {
            worker.removeEventListener('message', handleMessage)
            resolve(data)
          }
        }

        worker.addEventListener('message', handleMessage)

        worker.postMessage({
          mode,
          encryptionMode: 'pubk',
          file: inputType === 'file' ? selectedFile : undefined,
          filename: inputType === 'file' ? fileInfo?.name : undefined,
          text: inputType === 'message' ? textInput : undefined,
          publicKey,
          privateKey,
          isTextMode: inputType === 'message'
        })
      })

      if (inputType === 'file') {
        setEncryptedData(result.data)
        if (mode === 'decrypt' && result.originalExtension) {
          setFileInfo(prev => prev ? {
            ...prev,
            originalExtension: result.originalExtension
          } : null)
        }
        if (result.base64) {
          setTextResult(result.base64)
          setTextInput(result.base64)
        }
        if (result.signatureValid !== undefined) {
          toast.info(tMessages(`info.signature${result.signatureValid ? 'Valid' : 'Invalid'}`))
        }
        toast.success(tMessages(`success.${mode === 'encrypt' ? 'fileEncrypted' : 'fileDecrypted'}`))
      } else {
        setTextResult(result.base64 || '')
        setTextInput(result.base64 || '')
        setEncryptedData(result.data)
        if (mode === 'decrypt' && result.signatureValid !== undefined) {
          toast.info(tMessages(`info.signature${result.signatureValid ? 'Valid' : 'Invalid'}`))
        }
        toast.success(tMessages(`success.${mode === 'encrypt' ? 'textEncrypted' : 'textDecrypted'}`))
      }

      setTimeout(() => {
        setProgress(0)
      }, 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tMessages('error.failedProcessFile'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="relative py-8 sm:py-12 md:py-16 z-[1] bg-[#f5f3f0] dark:bg-[#0E0F11]">
        <Image
          src="/MaskGroup.svg"
          alt="Hero Background"
          fill
          className="w-full h-full object-contain sm:object-cover -z-10 dark:hidden"
        />
        <Image
          src="/MaskGroup_Dark.svg"
          alt="Hero Background"
          fill
          className="w-full h-full object-contain sm:object-cover -z-10 hidden dark:block"
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
          multiple={false}
        />
        <div className="flex justify-center items-center relative z-10 w-full max-w-[100vw] sm:max-w-3xl mx-auto px-4 sm:px-6">
          <Tabs
            defaultValue="file"
            className="flex flex-col items-center w-full"
            onValueChange={(value) => {
              clearState()
              setInputType(value as 'file' | 'message')
            }}
          >
            <TabsList className="flex h-auto bg-white dark:bg-[#282B30] p-1 rounded-t-lg justify-center">
              <TabsTrigger
                value="file"
                className="flex-1 sm:flex-none px-4 sm:px-8 py-2 text-xs sm:text-sm font-medium text-[#00000099] dark:text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-700 dark:data-[state=active]:bg-blue-600 transition-colors rounded-md cursor-pointer"
              >
                {tNavigation('upload')}
              </TabsTrigger>
              <TabsTrigger
                value="message"
                className="flex-1 sm:flex-none px-4 sm:px-8 py-2 text-xs sm:text-sm font-medium text-[#00000099] dark:text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-700 dark:data-[state=active]:bg-blue-600 transition-colors rounded-md cursor-pointer"
              >
                {tNavigation('pasteText')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="w-full max-w-[90vw] mt-0">
              <div className="py-4 sm:py-6 space-y-6">
                <div className="bg-white dark:bg-[#282B30] rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-6">
                  {fileInfo ? (
                    <div className="p-4 rounded-lg border-1 border-dashed border-blue-300 dark:border-blue-500 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-md bg-gray-100 dark:bg-gray-700">
                        <div className="flex items-center flex-1 space-x-3 w-full">
                          <Image
                            src="/FolderFilled.svg"
                            alt={tUpload('selectedFile')}
                            width={36}
                            height={36}
                            className="w-9 h-9 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-300"
                          />
                          <div className="flex flex-col flex-1 gap-1 sm:gap-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-[300px]">
                              {fileInfo.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(fileInfo.size)}
                            </span>
                          </div>
                        </div>
                        <Button
                          size={'sm'}
                          variant="secondary"
                          className="mt-2 sm:mt-0 size-8 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/50"
                          onClick={clearState}
                        >
                          <X />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center p-4 sm:p-6 border-1 border-dashed rounded-md cursor-pointer transition-all py-8 sm:py-12',
                        isDragOver
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                      )}
                      onClick={triggerFileInput}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Image
                        src="/Files.svg"
                        alt={tUpload('dragDrop')}
                        width={36}
                        height={36}
                        className="w-9 h-9 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-300 mb-2 sm:mb-3"
                      />
                      <p className={cn(
                        'text-xs sm:text-sm font-medium text-center',
                        isDragOver
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-200'
                      )}>
                        {isDragOver ? tUpload('dropHere') : tUpload('dragDrop')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{tUpload('or')}</p>
                      <Button
                        size={'sm'}
                        variant="outline"
                        className="mt-2 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer"
                      >
                        {tUpload('selectFile')}
                      </Button>
                    </div>
                  )}
                  {textResult && (
                    <div className="mt-4">
                      <Textarea
                        value={textResult}
                        readOnly
                        placeholder={tInput('pasteText')}
                        className="h-[186px] sm:min-h-[238px] max-h-[238px] sm:max-h-[300px] font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 pr-3 sm:pr-4 pb-10 sm:pb-14"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="message" className="w-full max-w-[90vw] mt-0">
              <div className="py-4 sm:py-6 space-y-6">
                <TextInputArea
                  textInput={textInput}
                  textResult={textResult}
                  onTextChange={handleTextInputChange}
                />
              </div>
            </TabsContent>
            {(selectedFile || textInput) && (
              <div className="flex flex-col items-center w-full max-w-[90vw] sm:max-w-2xl">
                <div className="w-full sm:w-3/4 space-y-6 sm:space-y-8">
                  {!encryptedData && (
                    <div className="space-y-4">
                      <div className="space-y-2 relative">
                        <Label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {processMode === 'encrypt' ? tInput('publicKey') : tInput('privateKey')}
                        </Label>
                        <div className="relative">
                          {
                            processMode === 'encrypt' ? (
                              <Input
                                ref={keyInputRef}
                                value={keyInput}
                                onChange={(e) => handleKeyInputChange(e.target.value)}
                                onFocus={handleKeyInputFocus}
                                onBlur={handleKeyInputBlur}
                                placeholder={tInput('enterPublicKey')}
                                className="font-mono text-xs sm:text-sm h-10 flex-1 rounded-lg border-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-200"
                              />
                            ) : (
                              <PasswordInput
                                ref={keyInputRef}
                                value={keyInput}
                                onChange={(e) => handleKeyInputChange(e.target.value)}
                                onFocus={handleKeyInputFocus}
                                onBlur={handleKeyInputBlur}
                                placeholder={tInput('enterPrivateKey')}
                                className="font-mono text-xs sm:text-sm h-10 flex-1 rounded-lg border-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-200"
                              />
                            )
                          }
                          {matchedKeys.length > 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          )}

                          {showKeyDropdown && matchedKeys.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                                  <Eye className="w-4 h-4" />
                                  <span>{processMode === 'encrypt' ? tInput('publicKey') : tInput('privateKey')}</span>
                                </div>
                                {matchedKeys.map((key, index) => {
                                  const secondaryText = getKeySecondaryText(key)
                                  const isSelected = processMode === 'encrypt'
                                    ? keyInput === key.publicKey
                                    : ('mnemonic' in key && key.mnemonic)
                                      ? keyInput === key.mnemonic
                                      : keyInput === key.publicKey

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md"
                                      onClick={() => handleKeySelect(key)}
                                    >
                                      <div className="flex-1 min-w-0">
                                        {!(processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic) && (
                                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono truncate">
                                            {key.publicKey}
                                          </div>
                                        )}
                                        {secondaryText && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                            - {processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic
                                              ? secondaryText
                                              : secondaryText}
                                          </div>
                                        )}
                                        {key.note && processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic && (
                                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                                            - {key.note}
                                          </div>
                                        )}
                                      </div>
                                      {isSelected && (
                                        <Check className="w-4 h-4 text-blue-500 ml-2 flex-shrink-0" />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {processMode === 'decrypt' && getMatchedPublicKey() && (
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {tInput('publicKey')}
                          </Label>
                          <PasswordInput
                            value={getMatchedPublicKey() || ''}
                            readOnly
                            defaultShowPassword={true}
                            className="font-mono text-xs sm:text-sm h-10 flex-1 rounded-lg border-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 cursor-default"
                            placeholder={tInput('publicKey')}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {!encryptedData && (
                    <Button
                      variant="default"
                      size="lg"
                      disabled={
                        (inputType === 'file' && !selectedFile) ||
                        (inputType === 'message' && !textInput) ||
                        !keyInput ||
                        isProcessing
                      }
                      onClick={processInput}
                      className={cn(
                        'w-full text-white rounded-md relative overflow-hidden cursor-pointer h-10 text-sm sm:text-base',
                        processMode === 'encrypt'
                          ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                          : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0 left-0 h-full transition-all duration-300',
                          processMode === 'encrypt' ? 'bg-blue-400 dark:bg-blue-600' : 'bg-green-400 dark:bg-green-600'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                      <span className="relative z-10">
                        {tButtons(processMode === 'encrypt' ? 'encrypt' : 'decrypt')}
                        {isProcessing && ` ${progress}%`}
                      </span>
                    </Button>
                  )}
                  {encryptedData && (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button
                        variant="default"
                        size="lg"
                        onClick={clearState}
                        className="w-full sm:flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-200 rounded-md cursor-pointer h-10 text-sm sm:text-base"
                      >
                        {tButtons('reset')}
                        <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      </Button>
                      {inputType === 'message' && (
                        <Button
                          variant="default"
                          size="lg"
                          onClick={handleCopy}
                          className="w-full sm:flex-1 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-md cursor-pointer h-10 text-sm sm:text-base"
                        >
                          {tButtons('copy')}
                          <Copy className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="lg"
                        disabled={isProcessing}
                        onClick={handleDownload}
                        className={cn(
                          'w-full text-white rounded-md cursor-pointer h-10 text-sm sm:text-base',
                          inputType === 'message' ? 'sm:flex-1' : 'sm:flex-2',
                          'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'
                        )}
                      >
                        {tButtons('download')}
                        <Download className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Tabs>
        </div>
      </div>

      <HowItWorksSection />
    </>
  )
}
