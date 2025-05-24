'use client'

import { base58 } from '@scure/base'
import { HDKey } from '@scure/bip32'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { Upload, Lock, Unlock, Download, FileText, Key, Clipboard } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import FeaturesSection from '@/components/FeaturesSection'
import { FileInfoDisplay } from '@/components/FileInfoDisplay'
import ModeSwitcher from '@/components/ModeSwitcher'
import ProgressIndicator from '@/components/ProgressIndicator'
import GradientText from '@/components/reactbits/GradientText'
import ShinyText from '@/components/reactbits/ShinyText'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_DERIVATION_PATH,
  generateTimestamp,
  getFilenameWithoutExtension,
  validateBase58PublicKey
} from '@/lib/utils'
import { FileInfo, KeyPair } from '@/types'

// Main page component for file and message encryption/decryption
export default function Home() {
  const pathname = usePathname()

  // State for user inputs and processing
  const [keyInput, setKeyInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputMode, setInputMode] = useState<'file' | 'message'>('file')
  const [encryptedText, setEncryptedText] = useState('')
  const [encryptedData, setEncryptedData] = useState<ArrayBuffer | null>(null) // Store original encrypted data
  const [decryptedText, setDecryptedText] = useState('') // Store decrypted text for dialog
  const [decryptedData, setDecryptedData] = useState<ArrayBuffer | null>(null) // Store decrypted data for download
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)

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

  // Handle file selection
  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file)
    if (file) {
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type || 'Unknown'
      })
    } else {
      setFileInfo(null)
    }
  }, [])

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
      downloadFile(decryptedData, `${timestamp}.txt`)
      toast.success('File downloaded')
    }
  }, [decryptedData])

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
    }
  }, [encryptedData, decryptedData, fileInfo])

  // Read file as chunks
  const readFileChunk = (file: File, offset: number, chunkSize: number): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const blob = file.slice(offset, offset + chunkSize)
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(blob)
    })
  }

  // Download data as a file
  const downloadFile = (data: ArrayBuffer, filename: string) => {
    const blob = new Blob([data])
    const url = URL.createObjectURL(blob)
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
  }

  // Process encryption or decryption
  const processInput = async (mode: 'encrypt' | 'decrypt') => {
    if (inputMode === 'file' && !selectedFile) {
      toast.error('Please select a file first')
      return
    }
    if (inputMode === 'message' && !textInput.trim()) {
      toast.error('Please input the message for processing')
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

      if (inputMode === 'file' && selectedFile) {
        // Process file input
        const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
        const chunks: ArrayBuffer[] = []
        const fileSize = selectedFile.size
        let offset = 0
        while (offset < fileSize) {
          const chunk = await readFileChunk(selectedFile, offset, CHUNK_SIZE)
          chunks.push(chunk)
          offset += CHUNK_SIZE
        }
        if (fileSize > 50 * 1024 * 1024) {
          toast.warning('Large file detected. Processing may be slow on client-side.')
        }

        const result = await new Promise<{
          data: ArrayBuffer;
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
            chunks,
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
      } else if (inputMode === 'message') {
        // Process text input
        let chunks: ArrayBuffer[] = []
        if (mode === 'encrypt') {
          const textBuffer = new TextEncoder().encode(textInput)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          // TODO: pending
          chunks = [textBuffer.buffer]
        } else {
          try {
            const decodedText = Buffer.from(textInput.trim(), 'base64')
            chunks = [decodedText.buffer]
          } catch (error) {
            console.error('Invalid Base64 input for decryption:', error)
            throw new Error('Invalid Base64 input for decryption')
          }
        }

        const result = await new Promise<{
          data: ArrayBuffer;
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
          const timestamp = generateTimestamp()
          const filename = mode === 'encrypt' ? `encrypted_text_${timestamp}.enc` : `${timestamp}.txt`
          worker.postMessage({
            mode,
            chunks,
            filename,
            publicKey,
            privateKey,
            isTextMode: true
          })
        })

        if (mode === 'encrypt') {
          const encrypted = Buffer.from(result.data).toString('base64')
          setEncryptedText(encrypted)
          setEncryptedData(result.data)
          setIsDialogOpen(true)
        } else {
          const decrypted = new TextDecoder().decode(result.data)
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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-xl mx-auto border-none bg-card/20 backdrop-blur-lg p-4 sm:p-6 md:p-8 transition-all duration-300 rounded-2xl">
        <CardHeader className="text-center space-y-2 sm:space-y-3">
          <GradientText className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-2 sm:gap-3">
            SecureVault
          </GradientText>
          <ShinyText
            text="ECIES File & Message Encryption Tool"
            disabled={false}
            speed={3}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium"
          />
        </CardHeader>

        <CardContent className="px-2 sm:px-4 space-y-6 sm:space-y-8">
          <ModeSwitcher value={pathname === '/password' ? 'pwd' : 'puk'} />
          {/* Hidden file input */}
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
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
                    Input Mode
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant={inputMode === 'file' ? 'default' : 'outline'}
                      onClick={() => {
                        setInputMode('file')
                        setTimeout(() => fileInputRef.current?.click(), 100)
                      }}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <Upload className="w-4 h-4" />
                      File
                    </Button>
                    <Button
                      variant={inputMode === 'message' ? 'default' : 'outline'}
                      onClick={() => setInputMode('message')}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <FileText className="w-4 h-4" />
                      Messages
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Public Key
                  </Label>
                  <Input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter Base58 public key (approx. 44-45 characters)"
                    className="font-mono text-sm h-[40px] flex-1"
                  />
                </div>

                {inputMode === 'file' ? (
                  fileInfo && (
                    <div className="space-y-3 sm:space-y-4">
                      <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                        Selected File
                      </Label>
                      <FileInfoDisplay fileInfo={fileInfo} />
                    </div>
                  )
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Message
                    </Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter the message to be encrypted"
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="lg"
                    disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'message' && !textInput.trim()) || !keyInput || isProcessing}
                    onClick={() => processInput('encrypt')}
                    className="flex-1 text-white transition-all duration-300 shadow-md disabled:shadow-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-400/30 hover:shadow-blue-500/40"
                  >
                    <Lock className="w-5 h-5" />
                    Encrypt
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    disabled={isProcessing || (!encryptedData && !decryptedData)}
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="decrypt">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Input Mode
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant={inputMode === 'file' ? 'default' : 'outline'}
                      onClick={() => {
                        setInputMode('file')
                        setTimeout(() => fileInputRef.current?.click(), 100)
                      }}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <Upload className="w-4 h-4" />
                      File
                    </Button>
                    <Button
                      variant={inputMode === 'message' ? 'default' : 'outline'}
                      onClick={() => setInputMode('message')}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <FileText className="w-4 h-4" />
                      Messages
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Private Key or Mnemonic
                  </Label>
                  <Input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter private key (64 hex) or mnemonic phrase"
                    className="font-mono text-sm h-[40px] flex-1"
                  />
                </div>

                {inputMode === 'file' ? (
                  fileInfo && (
                    <div className="space-y-3 sm:space-y-4">
                      <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                        Selected File
                      </Label>
                      <FileInfoDisplay fileInfo={fileInfo} />
                    </div>
                  )
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Message
                    </Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter the message to be decrypted"
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="lg"
                    disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'message' && !textInput.trim()) || !keyInput || isProcessing}
                    onClick={() => processInput('decrypt')}
                    className="flex-1 text-white transition-all duration-300 shadow-md disabled:shadow-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-400/30 hover:shadow-green-500/40"
                  >
                    <Unlock className="w-5 h-5" />
                    Decrypt
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    disabled={isProcessing || (!encryptedData && !decryptedData)}
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </Button>
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
                className="font-mono text-xs sm:text-sm mt-1 sm:mt-1.5 min-h-[100px] sm:min-h-[120px] max-h-[30vh] sm:max-h-[40vh] overflow-y-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
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
    </div>
  )
}
