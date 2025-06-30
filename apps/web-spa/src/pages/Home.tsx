'use client'

import {
  Button,
  Label,
  PasswordInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn
} from '@ttpos/share-ui'
import {
  deriveKeyPair,
  detect,
  formatFileSize,
  isBase58String,
  isHexString,
  isMnemonicPhrase,
  validateBase58PublicKey
} from '@ttpos/share-utils'
import { Download, RefreshCw, X, Copy } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import HowItWorksSection from '@/components/HowItWorksSection'
import { generateDownloadFilename } from '@/lib/utils'
import type { FileInfo } from '@/types'
import CryptoWorker from '@/workers/cryptoWorker.ts?worker&inline'

export default function HomePage() {
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
  const workerRef = useRef<Worker | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // workerRef.current = new Worker(new URL('../workers/cryptoWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = new CryptoWorker();
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
            setKeyInput(pubKey)
            setProcessMode('encrypt')
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
  }, [])

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
            toast.info('Detected public key encrypted file, switching to Key Encryption mode')
            setInputType('file')
          }
          setProcessMode(file.name.endsWith('.enc') ? 'decrypt' : 'encrypt')
        } else if (metadata.encryptionType === 'signed') {
          toast.error('Signed files are not supported yet')
          clearState()
          return
        } else {
          setProcessMode('encrypt')
        }
      } catch (error) {
        console.error('File detection failed:', error)
        toast.error('Failed to process file')
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
        toast.error('Please select only one file at a time')
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
              toast.info('Detected public key encrypted file, switching to Key Encryption mode')
              setInputType('file')
            }
            setProcessMode(file.name.endsWith('.enc') ? 'decrypt' : 'encrypt')
          } else if (metadata.encryptionType === 'signed') {
            toast.error('Signed files are not supported yet')
            clearState()
            return
          } else {
            setProcessMode('encrypt')
          }
        }
      } catch (error) {
        console.error('File detection failed:', error)
        toast.error('Failed to process file')
        clearState()
      }
    }
  }

  const handleDownload = useCallback(() => {
    if (encryptedData) {
      const filename = generateDownloadFilename(inputType, fileInfo, processMode)
      downloadFile(encryptedData, filename)
      toast.success(`${processMode === 'encrypt' ? 'Encrypted' : 'Decrypted'} ${inputType === 'file' ? 'file' : 'text'} downloaded successfully`)
    }
  }, [encryptedData, inputType, fileInfo, processMode])

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

  const handleCopy = () => {
    if (textResult) {
      navigator.clipboard.writeText(textResult).then(() => {
        toast.success('Text copied to clipboard!')
      }).catch(() => {
        toast.error('Failed to copy text')
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const processInput = async () => {
    if (inputType === 'file' && !selectedFile) {
      toast.error('Please select a file')
      return
    }
    if (inputType === 'message' && !textInput) {
      toast.error('Please enter text to process')
      return
    }
    if (!keyInput) {
      toast.error(`Please enter a ${processMode === 'encrypt' ? 'public key' : 'private key or mnemonic'}`)
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
            throw new Error(validation.error)
          }
          publicKey = _keyInput
        } else {
          throw new Error('Invalid input. Please enter a valid Base58 public key')
        }
      } else {
        if (isHexString(_keyInput)) {
          if (_keyInput.length !== 64) {
            throw new Error('Invalid private key length. Must be 32 bytes (64 hex characters)')
          }
          privateKey = _keyInput
        } else if (isMnemonicPhrase(keyInput)) {
          privateKey = deriveKeyPair(keyInput).privateKey
        } else {
          throw new Error('Invalid input. Please enter a valid private key (64 hex characters) or mnemonic phrase')
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
        if (result.signatureValid !== undefined) {
          toast.info(`Signature verification: ${result.signatureValid ? 'Valid' : 'Invalid'}`)
        }
        toast.success(`File ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully! Please click the download button to save.`)
      } else {
        setTextResult(result.base64 || '')
        setEncryptedData(result.data)
        if (mode === 'decrypt' && result.signatureValid !== undefined) {
          toast.info(`Signature verification: ${result.signatureValid ? 'Valid' : 'Invalid'}`)
        }
        toast.success(`Text ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully!`)
      }

      setTimeout(() => {
        setProgress(0)
      }, 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred during processing')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="relative py-8 sm:py-12 md:py-16 z-[1] bg-[#f5f3f0] dark:bg-gray-900">
        <img
          src="/MaskGroup.svg"
          alt="Hero Background"
          className="absolute w-full h-full object-contain sm:object-cover -z-10"
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
            <TabsList className="flex h-auto bg-white dark:bg-gray-800 p-1 rounded-t-lg justify-center">
              <TabsTrigger
                value="file"
                className="flex-1 sm:flex-none px-4 sm:px-8 py-2 text-xs sm:text-sm font-medium text-[#00000099] dark:text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-700 dark:data-[state=active]:bg-blue-600 transition-colors rounded-md cursor-pointer"
              >
                Upload
              </TabsTrigger>
              <TabsTrigger
                value="message"
                className="flex-1 sm:flex-none px-4 sm:px-8 py-2 text-xs sm:text-sm font-medium text-[#00000099] dark:text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-700 dark:data-[state=active]:bg-blue-600 transition-colors rounded-md cursor-pointer"
              >
                Paste Text
              </TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="w-full max-w-[90vw] mt-0">
              <div className="py-4 sm:py-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-6">
                  {fileInfo ? (
                    <div className="p-4 rounded-lg border-1 border-dashed border-blue-300 dark:border-blue-500 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-md bg-gray-100 dark:bg-gray-700">
                        <div className="flex items-center flex-1 space-x-3 w-full">
                          <img
                            src="/FolderFilled.svg"
                            alt="Selected File"
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
                      <img
                        src="/Files.svg"
                        alt="Upload File"
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
                        {isDragOver ? 'Drop your file here!' : 'Drag & Drop Your File'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">or</p>
                      <Button
                        size={'sm'}
                        variant="outline"
                        className="mt-2 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer"
                      >
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="message" className="w-full max-w-[90vw] mt-0">
              <div className="py-4 sm:py-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-6">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target?.value)}
                    placeholder="Paste or enter text to encrypt or decrypt"
                    className="h-[186px] sm:min-h-[238px] max-h-[238px] sm:max-h-[300px] font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 pr-3 sm:pr-4 pb-10 sm:pb-14"
                  />
                </div>
              </div>
            </TabsContent>
            {(selectedFile || textInput) && (
              <div className="flex flex-col items-center w-full max-w-[90vw] sm:max-w-2xl">
                <div className="w-full sm:w-3/4 space-y-6 sm:space-y-8">
                  {!encryptedData && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {processMode === 'encrypt' ? 'Public Key' : 'Private Key or Mnemonic'}
                      </Label>
                      <PasswordInput
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder={
                          processMode === 'encrypt'
                            ? 'Enter Base58 public key (approx. 44-45 characters)'
                            : 'Enter private key or mnemonic phrase'
                        }
                        className="font-mono text-xs sm:text-sm h-10 flex-1 rounded-lg border-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-200"
                      />
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
                        {processMode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
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
                        Reset
                        <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      </Button>
                      {inputType === 'message' && (
                        <Button
                          variant="default"
                          size="lg"
                          onClick={handleCopy}
                          className="w-full sm:flex-1 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-md cursor-pointer h-10 text-sm sm:text-base"
                        >
                          Copy
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
                        Download
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
