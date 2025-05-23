'use client'

import { base58 } from '@scure/base'
import { HDKey } from '@scure/bip32'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { Upload, Lock, Unlock, Download, FileText, Key, Clipboard } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'

import FeaturesSection from '@/components/FeaturesSection'
import GradientText from '@/components/reactbits/GradientText'
import ShinyText from '@/components/reactbits/ShinyText'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn, validateBase58PublicKey } from '@/lib/utils'

// Default derivation path for key generation
// eslint-disable-next-line quotes
const DEFAULT_DERIVATION_PATH = "m/44'/0'/0'/0/0"

interface FileInfo {
  name: string
  size: number
  type: string
}

interface KeyPair {
  publicKey: string
  privateKey: string
}

export default function Home() {
  const [keyInput, setKeyInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [autoDownload, setAutoDownload] = useState(true)
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const [encryptedText, setEncryptedText] = useState('')
  const [encryptedData, setEncryptedData] = useState<ArrayBuffer | null>(null) // Store original encrypted data
  const [decryptedText, setDecryptedText] = useState('') // Store decrypted text for dialog
  const [decryptedData, setDecryptedData] = useState<ArrayBuffer | null>(null) // Store decrypted data for download
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/cryptoWorker.ts', import.meta.url))
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  // Extract public key from URL hash parameter
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
      } else {
        setKeyInput('')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDownloadEncrypted = useCallback(() => {
    if (encryptedData) {
      downloadFile(encryptedData, 'encrypted_text.txt.enc')
      toast.success('File downloaded')
    }
  }, [encryptedData])

  const handleDownloadDecrypted = useCallback(() => {
    if (decryptedData) {
      downloadFile(decryptedData, 'decrypted_text.txt')
      toast.success('File downloaded')
    }
  }, [decryptedData])

  const readFileChunk = (file: File, offset: number, chunkSize: number): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const blob = file.slice(offset, offset + chunkSize)
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(blob)
    })
  }

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

  const isBase58String = (input: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(input)
  }

  const isHexString = (input: string): boolean => {
    return /^[0-9a-fA-F]+$/.test(input)
  }

  const isMnemonicPhrase = (input: string): boolean => {
    return input.split(' ').length >= 12
  }

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Text copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy text:', error)
      toast.error('Failed to copy text')
    }
  }

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
  }

  const processInput = async (mode: 'encrypt' | 'decrypt') => {
    if (inputMode === 'file' && !selectedFile) {
      toast.error('Please select a file first')
      return
    }

    if (inputMode === 'text' && !textInput.trim()) {
      toast.error('Please enter text to process')
      return
    }

    if (!keyInput) {
      toast.error(mode === 'decrypt' ? 'Please enter a private key or mnemonic phrase' : 'Please enter a public key')
      return
    }

    setIsProcessing(true)

    try {
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
          if (keyInput.length === 64) {
            privateKey = keyInput
          } else {
            throw new Error('Invalid private key length. Must be 32 bytes (64 hex characters)')
          }
        } else if (isMnemonicPhrase(keyInput)) {
          const derivedKeys = deriveKeyPair(keyInput)
          privateKey = derivedKeys.privateKey
        } else {
          throw new Error('Invalid input. Please enter a valid private key (64 hex characters) or mnemonic phrase')
        }
      }

      const worker = workerRef.current
      if (!worker) throw new Error('Web Worker not initialized')

      if (inputMode === 'file' && selectedFile) {
        const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
        const chunks: ArrayBuffer[] = []
        const fileSize = selectedFile.size
        let offset = 0

        // Split file into chunks
        while (offset < fileSize) {
          const chunk = await readFileChunk(selectedFile, offset, CHUNK_SIZE)
          chunks.push(chunk)
          offset += CHUNK_SIZE
        }

        // Warn for large files
        if (fileSize > 50 * 1024 * 1024) {
          toast.warning('Large file detected. Processing may be slow on client-side.')
        }

        const result = await new Promise<{ data: ArrayBuffer; filename: string }>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent) => {
            const { data, error } = e.data
            if (error) reject(new Error(error))
            else resolve(data)
          }
          worker.postMessage({
            mode,
            chunks,
            filename: selectedFile.name,
            publicKey,
            privateKey,
            isTextMode: false // Indicate file mode
          })
        })

        if (autoDownload) {
          downloadFile(result.data, result.filename)
        } else if (mode === 'encrypt') {
          setEncryptedData(result.data)
          setEncryptedText(Buffer.from(result.data).toString('base64'))
          setIsDialogOpen(true)
        } else if (mode === 'decrypt') {
          setDecryptedData(result.data)
          setDecryptedText(new TextDecoder().decode(result.data))
          setIsDialogOpen(true)
        }
        toast.success(`File ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully!`)
      } else if (inputMode === 'text') {
        let chunks: ArrayBuffer[] = []
        if (mode === 'encrypt') {
          const textBuffer = new TextEncoder().encode(textInput)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          // TODO: pending
          chunks = [textBuffer.buffer]
        } else {
          // For decryption, assume textInput is Base64 encoded
          const decodedText = Buffer.from(textInput, 'base64')
          chunks = [decodedText.buffer]
        }

        const result = await new Promise<{ data: ArrayBuffer; filename: string }>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent) => {
            const { data, error } = e.data
            if (error) reject(new Error(error))
            else resolve(data)
          }
          worker.postMessage({
            mode,
            chunks,
            filename: mode === 'encrypt' ? 'encrypted_text.txt.enc' : 'decrypted_text.txt',
            publicKey,
            privateKey,
            isTextMode: true // Indicate text mode
          })
        })

        if (mode === 'encrypt' && !autoDownload) {
          // Convert ArrayBuffer to Base64 for readable display
          const encrypted = Buffer.from(result.data).toString('base64')
          setEncryptedText(encrypted)
          setEncryptedData(result.data) // Store the original encrypted data
          setIsDialogOpen(true)
        } else if (autoDownload) {
          downloadFile(result.data, result.filename)
        } else if (mode === 'decrypt') {
          const decrypted = new TextDecoder().decode(result.data)
          setDecryptedText(decrypted)
          setDecryptedData(result.data)
          setIsDialogOpen(true)
        }
        toast.success(`Text ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully!`)
      }
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
            text="ECIES File & Text Encryption Tool"
            disabled={false}
            speed={3}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium"
          />
        </CardHeader>

        <CardContent className="px-2 sm:px-4 space-y-6 sm:space-y-8">
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
                      onClick={() => setInputMode('file')}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <Upload className="w-4 h-4" />
                      File
                    </Button>
                    <Button
                      variant={inputMode === 'text' ? 'default' : 'outline'}
                      onClick={() => setInputMode('text')}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <FileText className="w-4 h-4" />
                      Text
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Public Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="Enter Base58 public key (approx. 44-45 characters)"
                      className="font-mono text-sm h-[40px] flex-1"
                    />
                  </div>
                </div>
                {inputMode === 'file' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Select File
                    </Label>
                    <div className="relative group">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      />
                      <div
                        className={cn(
                          'relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
                          fileInfo
                            ? 'border-blue-400 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDragLeave={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center p-6 sm:p-8 transition-transform duration-300 group-hover:scale-105">
                          <Upload
                            className={cn(
                              'w-10 h-10 sm:w-12 sm:h-12 mb-3',
                              fileInfo ? 'text-blue-500' : 'text-gray-400'
                            )}
                          />
                          <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 text-center font-medium">
                            {fileInfo ? `Selected: ${fileInfo.name}` : 'Click to select or drag and drop a file'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {fileInfo && (
                      <div className="rounded-xl bg-gray-50/50 dark:bg-gray-800/30 p-3 sm:p-4 text-xs sm:text-sm space-y-3 sm:space-y-4 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1.5 sm:space-y-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Filename</span>
                            <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">{fileInfo.name}</p>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Size</span>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">{formatFileSize(fileInfo.size)}</p>
                          </div>
                          <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Type</span>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">{fileInfo.type}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Input Text
                    </Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text to encrypt"
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                )}
                <div className="flex items-center justify-end space-x-2">
                  <Label htmlFor="auto-download-switch">
                    Auto Download {autoDownload ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="auto-download-switch"
                    checked={autoDownload}
                    onCheckedChange={setAutoDownload}
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="lg"
                    disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'text' && !textInput.trim()) || !keyInput || isProcessing}
                    onClick={() => processInput('encrypt')}
                    className="flex-1 text-white transition-all duration-300 shadow-md disabled:shadow-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-400/30 hover:shadow-blue-500/40"
                  >
                    <Lock className="w-5 h-5" />
                    Encrypt
                  </Button>
                  {!autoDownload && (
                    <Button
                      variant="default"
                      size="lg"
                      disabled={isProcessing}
                      onClick={() => {
                        toast.info('Manual download not yet implemented')
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </Button>
                  )}
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
                      onClick={() => setInputMode('file')}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <Upload className="w-4 h-4" />
                      File
                    </Button>
                    <Button
                      variant={inputMode === 'text' ? 'default' : 'outline'}
                      onClick={() => setInputMode('text')}
                      className="flex-1 flex items-center justify-center text-white"
                    >
                      <FileText className="w-4 h-4" />
                      Text
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Private Key or Mnemonic
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="Enter private key (64 hex) or mnemonic phrase"
                      className="font-mono text-sm h-[40px] flex-1"
                    />
                  </div>
                </div>
                {inputMode === 'file' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Select File
                    </Label>
                    <div className="relative group">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      />
                      <div
                        className={cn(
                          'relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
                          fileInfo
                            ? 'border-green-400 dark:border-green-500 bg-green-50/30 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDragLeave={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center p-6 sm:p-8 transition-transform duration-300 group-hover:scale-105">
                          <Upload
                            className={cn(
                              'w-10 h-10 sm:w-12 sm:h-12 mb-3',
                              fileInfo ? 'text-green-500' : 'text-gray-400'
                            )}
                          />
                          <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 text-center font-medium">
                            {fileInfo ? `Selected: ${fileInfo.name}` : 'Click to select or drag and drop a file'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {fileInfo && (
                      <div className="rounded-xl bg-gray-50/50 dark:bg-gray-800/30 p-3 sm:p-4 text-xs sm:text-sm space-y-3 sm:space-y-4 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1.5 sm:space-y-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Filename</span>
                            <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">{fileInfo.name}</p>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Size</span>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">{formatFileSize(fileInfo.size)}</p>
                          </div>
                          <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Type</span>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">{fileInfo.type}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Input Text
                    </Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter encrypted text to decrypt"
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                )}
                <div className="flex items-center justify-end space-x-2">
                  <Label htmlFor="auto-download-switch">
                    Auto Download {autoDownload ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="auto-download-switch"
                    checked={autoDownload}
                    onCheckedChange={setAutoDownload}
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="lg"
                    disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'text' && !textInput.trim()) || !keyInput || isProcessing}
                    onClick={() => processInput('decrypt')}
                    className="flex-1 text-white transition-all duration-300 shadow-md disabled:shadow-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-400/30 hover:shadow-green-500/40"
                  >
                    <Unlock className="w-5 h-5" />
                    Decrypt
                  </Button>
                  {!autoDownload && (
                    <Button
                      variant="default"
                      size="lg"
                      disabled={isProcessing}
                      onClick={() => {
                        toast.info('Manual download not yet implemented')
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </Button>
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

          {isProcessing && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div className="text-center text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
                Processing...
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse" />
              </div>
            </div>
          )}
          <FeaturesSection />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col bg-card/20 backdrop-blur-lg rounded-xl sm:rounded-2xl border-none shadow-lg p-4 sm:p-6">
          <DialogHeader className="shrink-0 space-y-1 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
              {isProcessing ? 'Processing...' : encryptedText ? 'Encrypted Text' : 'Decrypted Text'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              {encryptedText ? 'Your text has been encrypted successfully' : 'Your text has been decrypted successfully'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-1 sm:py-2 space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="filename" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Filename</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                  onClick={encryptedText ? handleDownloadEncrypted : handleDownloadDecrypted}
                  disabled={!encryptedData && !decryptedData}
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
              <Input
                id="filename"
                value={encryptedText ? 'encrypted_text.txt.enc' : 'decrypted_text.txt'}
                readOnly
                className="font-mono text-xs sm:text-sm mt-1 sm:mt-1.5 h-8 sm:h-10 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {encryptedText ? 'Encrypted Content' : 'Decrypted Content'}
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                  onClick={() => handleCopyText(encryptedText || decryptedText)}
                >
                  <Clipboard className="h-3 w-3" />
                  Copy content
                </Button>
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
                <span>Share this {encryptedText ? 'encrypted' : 'decrypted'} text securely</span>
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

      <Toaster richColors position="top-right" duration={3000} />
    </div>
  )
}
