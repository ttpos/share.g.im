'use client'

import { base58 } from '@scure/base'
import { HDKey } from '@scure/bip32'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { Lock, Unlock, Download, Key, Clipboard, RefreshCw, X, Upload } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import FeaturesSection from '@/components/FeaturesSection'
import { FileInfoDisplay } from '@/components/FileInfoDisplay'
import ModeSwitcher from '@/components/ModeSwitcher'
import ProgressIndicator from '@/components/ProgressIndicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_DERIVATION_PATH,
  generateTimestamp,
  getFilenameWithoutExtension,
  identifyEncryptionMode,
  validateBase58PublicKey
} from '@/lib/utils'
import { FileInfo, KeyPair } from '@/types'

// Main page component for file and message encryption/decryption (Public Key Mode)
export default function Home() {
  const pathname = usePathname()

  // State for user inputs and processing
  const [keyInput, setKeyInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [textInput, setTextInput] = useState('')
  const [inputType, setInputType] = useState<'file' | 'message'>('message')
  const [encryptedText, setEncryptedText] = useState('')
  const [encryptedData, setEncryptedData] = useState<Blob | null>(null)
  const [decryptedText, setDecryptedText] = useState('')
  const [decryptedData, setDecryptedData] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const workerRef = useRef<Worker | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/cryptoWorker.ts', import.meta.url))
    return () => workerRef.current?.terminate()
  }, [])

  // Extract public key from URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '')
      if (hash.startsWith('pub/')) {
        const pubKey = hash.substring(4)
        if (pubKey && isBase58String(pubKey)) {
          const validation = validateBase58PublicKey(pubKey)
          if (validation.isValid) {
            setKeyInput(pubKey)
          } else {
            toast.error('Invalid public key in URL')
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
  }, [])

  // Handle file drop
  const handleFileDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setTextInput('') // Clear text input when a file is dropped
      setInputType('file')
      const encryptionMode = await identifyEncryptionMode(file) as FileInfo['encryptionMode']
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type || 'Unknown',
        encryptionMode: encryptionMode
      })
    }
  }

  // Handle file selection via input
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setTextInput('')
      setInputType('file')
      const encryptionMode = await identifyEncryptionMode(file) as FileInfo['encryptionMode']
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type || 'Unknown',
        encryptionMode
      })
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Handle drag over to allow drop
  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value)
    setInputType('message')
  }

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null)
    setFileInfo(null)
    setTextInput('')
    setEncryptedText('')
    setEncryptedData(null)
    setDecryptedText('')
    setDecryptedData(null)
    setIsDialogOpen(false)
    setIsProcessing(false)
    setProcessingProgress(0)
    setProcessingStage('')
    setInputType('message')
    toast.success('File cleared. You can now input text.')
  }

  // Download encrypted data
  const handleDownloadEncrypted = useCallback(() => {
    if (encryptedData) {
      const timestamp = generateTimestamp()
      downloadFile(encryptedData, `encrypted_text_${timestamp}.enc`)
      toast.success('File downloaded')
    }
  }, [encryptedData])

  // Download decrypted data
  const handleDownloadDecrypted = useCallback(() => {
    if (decryptedData) {
      const timestamp = generateTimestamp()
      const extension = fileInfo?.originalExtension || 'txt'
      downloadFile(decryptedData, `${timestamp}.${extension}`)
      toast.success('File downloaded')
    }
  }, [decryptedData, fileInfo])

  // Handle file download with appropriate naming
  const handleDownload = useCallback(() => {
    if (encryptedData && fileInfo) {
      const timestamp = generateTimestamp()
      const nameWithoutExt = getFilenameWithoutExtension(fileInfo.name)
      downloadFile(encryptedData, `${nameWithoutExt}_${timestamp}.enc`)
      toast.success('Encrypted file downloaded successfully')
    } else if (decryptedData && fileInfo) {
      const timestamp = generateTimestamp()
      const extension = fileInfo.originalExtension || 'bin'
      downloadFile(decryptedData, `${timestamp}.${extension}`)
      toast.success('Decrypted file downloaded successfully')
    } else if (encryptedData && inputType === 'message') {
      handleDownloadEncrypted()
    } else if (decryptedData && inputType === 'message') {
      handleDownloadDecrypted()
    }
  }, [encryptedData, decryptedData, fileInfo, inputType, handleDownloadEncrypted, handleDownloadDecrypted])

  // Download data as a file
  const downloadFile = (data: Blob, filename: string) => {
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Derive key pair from mnemonic
  const deriveKeyPair = (mnemonic: string): KeyPair => {
    if (!bip39.validateMnemonic(mnemonic, wordlist)) {
      throw new Error('Invalid mnemonic phrase')
    }
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const masterNode = HDKey.fromMasterSeed(seed)
    const key = masterNode.derive(DEFAULT_DERIVATION_PATH)
    if (!key.privateKey || !key.publicKey) {
      throw new Error('Failed to derive key pair')
    }
    return {
      privateKey: Buffer.from(key.privateKey).toString('hex'),
      publicKey: base58.encode(key.publicKey)
    }
  }

  // Validate Base58 string
  const isBase58String = (input: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(input)
  }

  // Validate hex string
  const isHexString = (input: string): boolean => {
    return /^[0-9a-fA-F]+$/.test(input)
  }

  // Check if input is a mnemonic phrase
  const isMnemonicPhrase = (input: string): boolean => {
    return input.split(' ').length >= 12
  }

  // Copy text to clipboard
  const handleCopyText = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message)
      toast.success('Text copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy message:', error)
      toast.error('Failed to copy message')
    }
  }

  // Reset all states
  const clearState = () => {
    setKeyInput('')
    setSelectedFile(null)
    setFileInfo(null)
    setTextInput('')
    setEncryptedText('')
    setEncryptedData(null)
    setDecryptedText('')
    setDecryptedData(null)
    setIsDialogOpen(false)
    setIsProcessing(false)
    setProcessingProgress(0)
    setProcessingStage('')
    setInputType('message')
  }

  // Process encryption or decryption
  const processInput = async (mode: 'encrypt' | 'decrypt') => {
    if (inputType === 'file' && !selectedFile) {
      toast.error('Please select a file by clicking "Select File" or dragging it')
      return
    }
    if (inputType === 'message' && !textInput.trim()) {
      toast.error('Please input a message for processing')
      return
    }
    if (!keyInput) {
      toast.error(mode === 'decrypt' ? 'Please enter a private key or mnemonic phrase' : 'Please enter a public key')
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStage('Initializing...')

    try {
      // Validate and prepare keys
      let publicKey: string | undefined
      let privateKey: string | undefined

      if (mode === 'encrypt') {
        if (isBase58String(keyInput)) {
          const validation = validateBase58PublicKey(keyInput)
          if (!validation.isValid) {
            throw new Error(validation.error)
          }
          publicKey = keyInput
        } else {
          throw new Error('Invalid input. Please enter a valid Base58 public key')
        }
      } else {
        if (isHexString(keyInput)) {
          if (keyInput.length !== 64) {
            throw new Error('Invalid private key length. Must be 32 bytes (64 hex characters)')
          }
          privateKey = keyInput
        } else if (isMnemonicPhrase(keyInput)) {
          privateKey = deriveKeyPair(keyInput).privateKey
        } else {
          throw new Error('Invalid input. Please enter a valid private key (64 hex characters) or mnemonic phrase')
        }
      }

      const worker = workerRef.current
      if (!worker) throw new Error('Web Worker not initialized')

      if (inputType === 'file' && selectedFile) {
        // Process file input
        const result = await new Promise<{
          data: Blob;
          filename: string;
          originalExtension?: string;
        }>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent) => {
            const { data, error, progress, stage } = e.data
            if (error) {
              reject(new Error(error))
            } else if (progress !== undefined) {
              setProcessingProgress(progress)
              if (stage) {
                setProcessingStage(stage)
              }
            } else if (data) {
              resolve(data)
            }
          }
          worker.postMessage({
            mode,
            encryptionMode: 'pubk',
            file: selectedFile,
            filename: selectedFile.name,
            publicKey,
            privateKey,
            isTextMode: false
          })
        })

        if (mode === 'encrypt') {
          setEncryptedData(result.data)
        } else {
          setDecryptedData(result.data)
          if (result.originalExtension) {
            setFileInfo(prev => prev ? { ...prev, originalExtension: result.originalExtension } : null)
          }
        }
        toast.success(`File ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully! Please click the download button to save.`)
      } else if (inputType === 'message') {
        // Process text input
        let file: File
        if (mode === 'encrypt') {
          file = new File([textInput], `text_${generateTimestamp()}.txt`, { type: 'text/plain' })
        } else {
          try {
            const decodedText = Buffer.from(textInput.trim(), 'base64')
            file = new File([decodedText], `encrypted_${generateTimestamp()}.enc`, { type: 'application/octet-stream' })
          } catch (error) {
            console.error('Invalid Base64 input for decryption:', error)
            throw new Error('Invalid Base64 input for decryption')
          }
        }

        const result = await new Promise<{
          data: Blob;
          filename: string;
          originalExtension?: string;
        }>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent) => {
            const { data, error, progress, stage } = e.data
            if (error) {
              reject(new Error(error))
            } else if (progress !== undefined) {
              setProcessingProgress(progress)
              if (stage) {
                setProcessingStage(stage)
              }
            } else if (data) {
              resolve(data)
            }
          }
          worker.postMessage({
            mode,
            encryptionMode: 'pubk',
            file,
            filename: file.name,
            publicKey,
            privateKey,
            isTextMode: true
          })
        })

        if (mode === 'encrypt') {
          const arrayBuffer = await result.data.arrayBuffer()
          const encrypted = Buffer.from(arrayBuffer).toString('base64')
          setEncryptedText(encrypted)
          setEncryptedData(result.data)
          setIsDialogOpen(true)
        } else {
          const arrayBuffer = await result.data.arrayBuffer()
          const decrypted = new TextDecoder().decode(arrayBuffer)
          setDecryptedText(decrypted)
          setDecryptedData(result.data)
          setIsDialogOpen(true)
        }
        toast.success(`Text ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully!`)
      }

      setTimeout(() => {
        setProcessingProgress(0)
        setProcessingStage('')
      }, 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred during processing')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card className="border-none bg-card/20 backdrop-blur-lg">
        <CardContent className="px-4 space-y-6 sm:space-y-8">
          <ModeSwitcher value={pathname === '/password' ? 'pwd' : 'puk'} />
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Tabs defaultValue="encrypt" className="w-full" onValueChange={clearState}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="encrypt" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Encrypt
              </TabsTrigger>
              <TabsTrigger value="decrypt" className="flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                Decrypt
              </TabsTrigger>
              <TabsTrigger value="keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Keys
              </TabsTrigger>
            </TabsList>

            <TabsContent value="encrypt">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Public Key
                  </Label>
                  <Input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter Base58 public key (approx. 44-45 characters)"
                    className="font-mono text-sm h-[40px] flex-1 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>

                <div className="space-y-6">
                  {inputType === 'message' && (
                    <div className="space-y-3">
                      <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                        Input Message or File
                      </Label>
                      <div className="relative group">
                        <Textarea
                          value={textInput}
                          onChange={handleTextChange}
                          onDragOver={handleDragOver}
                          onDrop={handleFileDrop}
                          placeholder="Type a message to encrypt or drag & drop a file..."
                          className="min-h-[140px] max-h-[300px] font-mono text-sm break-all resize-none rounded-lg border-2 border-dashed transition-all duration-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 focus:bg-blue-50/30 dark:focus:bg-blue-900/20 pr-4 pb-14"
                        />
                        <div className="absolute bottom-3 left-3 right-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={triggerFileInput}
                            className="w-full flex items-center justify-center gap-2 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Select File to Encrypt</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {inputType === 'file' && fileInfo && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                        Selected File
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFile}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        Clear
                      </Button>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <FileInfoDisplay fileInfo={fileInfo} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {!(encryptedData || decryptedData) && (
                    <Button
                      variant="default"
                      size="lg"
                      disabled={(inputType === 'file' && !selectedFile) || (inputType === 'message' && !textInput.trim()) || !keyInput || isProcessing}
                      onClick={() => processInput('encrypt')}
                      className="flex-1 text-white transition-all duration-300 shadow-md disabled:shadow-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-400/30 hover:shadow-blue-500/40"
                    >
                      <Lock className="w-5 h-5" />
                      Encrypt
                    </Button>
                  )}
                  {(encryptedData || decryptedData) && (
                    <>
                      <Button
                        variant="default"
                        size="lg"
                        onClick={clearState}
                        className="flex-1 flex items-center justify-center gap-2 text-white transition-all duration-300 shadow-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-400/30 hover:shadow-orange-500/40"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Reset
                      </Button>
                      <Button
                        variant="default"
                        size="lg"
                        disabled={isProcessing}
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 text-white transition-all duration-300 shadow-md bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-400/30 hover:shadow-green-500/40"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="decrypt">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Private Key or Mnemonic
                  </Label>
                  <Input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter private key (64 hex) or mnemonic phrase"
                    className="font-mono text-sm h-[40px] flex-1 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>

                <div className="space-y-6">
                  {inputType === 'message' && (
                    <div className="space-y-3">
                      <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                        Input Message or File
                      </Label>
                      <div className="relative group">
                        <Textarea
                          value={textInput}
                          onChange={handleTextChange}
                          onDragOver={handleDragOver}
                          onDrop={handleFileDrop}
                          placeholder="Paste encrypted text here or drag & drop an encrypted file..."
                          className="min-h-[140px] max-h-[300px] font-mono text-sm break-all resize-none rounded-lg border-2 border-dashed transition-all duration-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 focus:bg-blue-50/30 dark:focus:bg-blue-900/20 pr-4 pb-14"
                        />
                        <div className="absolute bottom-3 left-3 right-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={triggerFileInput}
                            className="w-full flex items-center justify-center gap-2 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Select Encrypted File</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {inputType === 'file' && fileInfo && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                        Selected File
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFile}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        Clear
                      </Button>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <FileInfoDisplay fileInfo={fileInfo} isDecryptMode={true} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {!(encryptedData || decryptedData) && (
                    <Button
                      variant="default"
                      size="lg"
                      disabled={(inputType === 'file' && !selectedFile) || (inputType === 'message' && !textInput.trim()) || !keyInput || isProcessing}
                      onClick={() => processInput('decrypt')}
                      className="flex-1 text-white transition-all duration-300 shadow-md disabled:shadow-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-400/30 hover:shadow-green-500/40"
                    >
                      <Unlock className="w-5 h-5" />
                      Decrypt
                    </Button>
                  )}
                  {(encryptedData || decryptedData) && (
                    <>
                      <Button
                        variant="default"
                        size="lg"
                        onClick={clearState}
                        className="flex-1 flex items-center justify-center gap-2 text-white transition-all duration-300 shadow-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-400/30 hover:shadow-orange-500/40"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Reset
                      </Button>
                      <Button
                        variant="default"
                        size="lg"
                        disabled={isProcessing}
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 text-white transition-all duration-300 shadow-md bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-400/30 hover:shadow-green-500/40"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="keys">
              <div className="space-y-4">
                <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Key Management
                </Label>
                <p className="text-gray-600 dark:text-gray-400">Key generation and management features will be available soon.</p>
              </div>
            </TabsContent>
          </Tabs>

          <ProgressIndicator
            isProcessing={isProcessing}
            processingStage={processingStage}
            processingProgress={processingProgress}
          />
          <FeaturesSection />
        </CardContent>
      </Card>

      {/* Dialog for text encryption/decryption results */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col bg-card/20 backdrop-blur-lg rounded-xl sm:rounded-2xl border-none shadow-lg p-4 sm:p-6">
          <DialogHeader className="shrink-0 space-y-1 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
              {isProcessing ? 'Processing...' : encryptedText ? 'Encrypted Text' : 'Decrypted Text'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              {encryptedText ? 'Your message has been encrypted successfully' : 'Your message has been decrypted successfully'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-1 sm:py-2 space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {encryptedText ? 'Encrypted Content' : 'Decrypted Content'}
                </Label>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                    onClick={encryptedText ? handleDownloadEncrypted : handleDownloadDecrypted}
                    disabled={!encryptedData && !decryptedData}
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                    onClick={() => handleCopyText(encryptedText || decryptedText)}
                  >
                    <Clipboard className="h-3 w-3" />
                    <span className="hidden sm:inline">Copy content</span>
                  </Button>
                </div>
              </div>
              <Textarea
                id="content"
                value={encryptedText || decryptedText}
                readOnly
                className="font-mono text-xs sm:text-sm mt-1 sm:mt-1.5 min-h-[100px] sm:min-h-[120px] max-h-[300px] overflow-y-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t pt-3 sm:pt-4 mt-1 sm:mt-2">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between w-full items-center gap-2 sm:gap-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 w-full sm:w-auto text-center sm:text-left">
                <span>Share this {encryptedText ? 'encrypted' : 'decrypted'} message securely</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto h-9 sm:h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
