'use client'

import { formatFileSize } from '@ttpos/share-utils'
import { Download, RefreshCw, X, FileText, Info, Copy } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { FileInfoDisplay } from '@/components/FileInfoDisplay'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppState } from '@/contexts/AppStateContext'
import { cn, generateDownloadFilename } from '@/lib/utils'
import { FileInfo } from '@/types'

export function PasswordEncryption() {
  const {
    fileMetadata,
    selectedFile,
    textContent,
    processMode,
    handleReset
  } = useAppState()

  const [password, setPassword] = useState('')
  const [textInput, setTextInput] = useState(textContent || '')
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [inputType] = useState<'file' | 'message'>(selectedFile ? 'file' : 'message')
  const [encryptedData, setEncryptedData] = useState<Blob | null>(null)
  const [textResult, setTextResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    if (selectedFile) {
      setFileInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'Unknown',
        encryptionMode: 'password'
      })
      if (fileMetadata?.encryptionType && fileMetadata.encryptionType !== 'pwd' && fileMetadata.encryptionType !== 'unencrypted') {
        toast.error(`This file is ${fileMetadata.encryptionType} encrypted. Please switch to the correct encryption mode.`)
        handleReset()
      }
    } else {
      setFileInfo(null)
    }
  }, [selectedFile, fileMetadata, handleReset])

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/cryptoWorker.ts', import.meta.url))
    return () => workerRef.current?.terminate()
  }, [])

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
    setPassword('')
    setTextInput('')
    setFileInfo(null)
    setEncryptedData(null)
    setTextResult(null)
    setIsProcessing(false)
    handleReset()
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
    if (!password) {
      toast.error('Please enter a password')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const mode = processMode || 'encrypt'

      const worker = workerRef.current
      if (!worker) throw new Error('Web Worker not initialized')

      const result = await new Promise<{
        data: Blob
        base64?: string
        filename: string
        originalExtension?: string
      }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          const { data, error, progress } = e.data
          if (error) {
            reject(new Error(error))
          } else if (progress !== undefined) {
            setProgress(Math.round(progress))
          } else if (data) {
            resolve(data)
          }
        }

        worker.postMessage({
          mode,
          encryptionMode: 'pwd',
          file: inputType === 'file' ? selectedFile : undefined,
          filename: inputType === 'file' ? fileInfo?.name : undefined,
          text: inputType === 'message' ? textInput : undefined,
          password,
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
        toast.success(`File ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully! Please click the download button to save.`)
      } else {
        setTextResult(result.base64 || '')
        setEncryptedData(result.data)
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
    <div className="space-y-6">
      {!encryptedData && (
        <>
          {inputType === 'file' && fileInfo && (
            <FileInfoDisplay
              fileInfo={fileInfo}
              onClear={clearState}
            />
          )}

          {inputType === 'message' && (
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste or enter text to encrypt or decrypt"
              className="font-mono text-sm h-32 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
            />
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-200">
              Password
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter a strong password for encryption or decryption</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <PasswordInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="font-mono text-sm h-[42px] rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
        </>
      )}

      {inputType === 'message' && encryptedData && textResult && (
        <Textarea
          value={textResult}
          readOnly
          className="font-mono text-sm h-32 rounded-md border border-gray-300 dark:bg-gray-700"
        />
      )}

      {inputType === 'file' && encryptedData && fileInfo && (
        <FileInfoDisplay
          fileInfo={fileInfo}
          showStatus={true}
          statusText={processMode === 'encrypt' ? 'Encrypted' : 'Decrypted'}
          statusType={processMode}
        />
      )}

      <div className="flex gap-3 pt-2">
        {!encryptedData && (
          <Button
            variant="default"
            size="lg"
            disabled={
              (inputType === 'file' && !selectedFile) ||
              (inputType === 'message' && !textInput) ||
              !password ||
              isProcessing
            }
            onClick={processInput}
            className={cn(
              'flex-1 text-white rounded-md relative overflow-hidden',
              processMode === 'encrypt'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            )}
          >
            <div
              className={cn(
                'absolute top-0 left-0 h-full transition-all duration-300',
                processMode === 'encrypt' ? 'bg-blue-400' : 'bg-green-400'
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
          <>
            <Button
              variant="default"
              size="lg"
              onClick={clearState}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-black rounded-md"
            >
              Reset
              <RefreshCw className="w-5 h-5 mr-2" />
            </Button>
            {inputType === 'message' && (
              <Button
                variant="default"
                size="lg"
                onClick={handleCopy}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Copy
                <Copy className="w-5 h-5 mr-2" />
              </Button>
            )}
            <Button
              variant="default"
              size="lg"
              disabled={isProcessing}
              onClick={handleDownload}
              className={cn(
                'bg-green-600 hover:bg-green-700 text-white rounded-md',
                inputType === 'message' ? 'flex-1' : 'flex-2'
              )}
            >
              Download
              <Download className="w-5 h-5 mr-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
