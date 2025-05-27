'use client'

import { Upload, Lock, Unlock, Download, FileText, Clipboard, RefreshCw } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
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
import { PasswordInput } from '@/components/ui/password-input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { generateTimestamp, getFilenameWithoutExtension, identifyEncryptionMode } from '@/lib/utils'
import { FileInfo } from '@/types'

// Password page component for file and message encryption/decryption
export default function PasswordPage() {
  const pathname = usePathname()

  // State for user inputs and processing
  const [password, setPassword] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputMode, setInputMode] = useState<'file' | 'message'>('file')
  const [encryptedText, setEncryptedText] = useState('')
  const [encryptedData, setEncryptedData] = useState<Blob | null>(null)
  const [decryptedText, setDecryptedText] = useState('')
  const [decryptedData, setDecryptedData] = useState<Blob | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/pwdCryptoWorker.ts', import.meta.url))
    return () => workerRef.current?.terminate()
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File | null) => {
    setSelectedFile(file)
    if (file) {
      const encryptionMode = await identifyEncryptionMode(file) as FileInfo['encryptionMode']
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type || 'Unknown',
        encryptionMode: encryptionMode
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
    }
  }, [encryptedData, decryptedData, fileInfo])

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
    setPassword('')
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
    if (!password) {
      toast.error('Please enter a password')
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStage('Initializing...')

    try {
      const worker = workerRef.current
      if (!worker) throw new Error('Web Worker not initialized')

      if (inputMode === 'file' && selectedFile) {
        // Process file input
        const result = await new Promise<{ data: Blob; filename: string; originalExtension?: string }>((resolve, reject) => {
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
            file: selectedFile,
            filename: selectedFile.name,
            password,
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
        let file: File
        if (mode === 'encrypt') {
          file = new File([textInput], `text_${generateTimestamp()}.txt`, { type: 'text/plain' })
        } else {
          try {
            const decodedText = Buffer.from(textInput.trim(), 'base64')
            file = new File([decodedText], `encrypted_${generateTimestamp()}.enc`, { type: 'application/octet-stream' })
          } catch (error) {
            throw new Error('Invalid Base64 input for decryption')
          }
        }

        const result = await new Promise<{ data: Blob; filename: string; originalExtension?: string }>((resolve, reject) => {
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
            file,
            filename: file.name,
            password,
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
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
          <Tabs defaultValue="encrypt" className="w-full" onValueChange={clearState}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="encrypt" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Encrypt
              </TabsTrigger>
              <TabsTrigger value="decrypt" className="flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                Decrypt
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
                      className="flex-1 flex items-center justify-center dark:text-white"
                    >
                      <Upload className="w-4 h-4" />
                      File
                    </Button>
                    <Button
                      variant={inputMode === 'message' ? 'default' : 'outline'}
                      onClick={() => setInputMode('message')}
                      className="flex-1 flex items-center justify-center dark:text-white"
                    >
                      <FileText className="w-4 h-4" />
                      Messages
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="font-mono text-sm h-[40px] flex-1"
                  />
                </div>

                {inputMode === 'file' && fileInfo && (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Selected File
                    </Label>
                    <FileInfoDisplay fileInfo={fileInfo} />
                  </div>
                )}
                {inputMode === 'message' && (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Message
                    </Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter the message to be encrypted"
                      className="min-h-[100px] max-h-[300px] font-mono text-sm break-all"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  {!(encryptedData || decryptedData) && (
                    <Button
                      variant="default"
                      size="lg"
                      disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'message' && !textInput.trim()) || !password || isProcessing}
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
                    Input Mode
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant={inputMode === 'file' ? 'default' : 'outline'}
                      onClick={() => {
                        setInputMode('file')
                        setTimeout(() => fileInputRef.current?.click(), 100)
                      }}
                      className="flex-1 flex items-center justify-center dark:text-white"
                    >
                      <Upload className="w-4 h-4" />
                      File
                    </Button>
                    <Button
                      variant={inputMode === 'message' ? 'default' : 'outline'}
                      onClick={() => setInputMode('message')}
                      className="flex-1 flex items-center justify-center dark:text-white"
                    >
                      <FileText className="w-4 h-4" />
                      Messages
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="font-mono text-sm h-[40px] flex-1"
                  />
                </div>
                {inputMode === 'file' && fileInfo && (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Selected File
                    </Label>
                    <FileInfoDisplay fileInfo={fileInfo} isDecryptMode={true} />
                  </div>
                )}
                {inputMode === 'message' && (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Message
                    </Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter the message to be decrypted"
                      className="min-h-[100px] max-h-[300px] font-mono text-sm break-all"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  {!(encryptedData || decryptedData) && (
                    <Button
                      variant="default"
                      size="lg"
                      disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'message' && !textInput.trim()) || !password || isProcessing}
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
          </Tabs>

          <ProgressIndicator
            isProcessing={isProcessing}
            processingStage={processingStage}
            processingProgress={processingProgress}
          />
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
