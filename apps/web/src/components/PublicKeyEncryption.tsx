'use client'

import { deriveKeyPair, isBase58String, isHexString, isMnemonicPhrase, validateBase58PublicKey, formatFileSize } from '@ttpos/share-utils'
import { Download, RefreshCw, X, FileText, Info, Copy } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppState } from '@/contexts/AppStateContext'
import { cn, generateDownloadFilename } from '@/lib/utils'
import { FileInfo } from '@/types'

export function PublicKeyEncryption() {
  const {
    fileMetadata,
    selectedFile,
    textContent,
    processMode,
    initialKey,
    handleReset
  } = useAppState()

  const [keyInput, setKeyInput] = useState(initialKey || '')
  const [textInput, setTextInput] = useState(textContent || '')
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [inputType] = useState<'file' | 'message'>(selectedFile ? 'file' : 'message')
  const [encryptedData, setEncryptedData] = useState<Blob | null>(null)
  const [textResult, setTextResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    if (initialKey) {
      setKeyInput(initialKey)
    }
  }, [initialKey])

  useEffect(() => {
    if (selectedFile) {
      setFileInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'Unknown',
        encryptionMode: 'public-key'
      })
      if (fileMetadata?.encryptionType && fileMetadata.encryptionType !== 'pubk' && fileMetadata.encryptionType !== 'unencrypted') {
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
    setKeyInput('')
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
    <div className="space-y-6">
      {!encryptedData && (
        <>
          {inputType === 'file' && fileInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-md border-2 border-dashed border-border p-4 space-y-4">
              <div className="px-2 py-4 rounded-md flex justify-between items-center bg-stone-100">
                <div className="flex items-center truncate space-x-3">
                  <FileText className="w-14 h-14 text-blue-500" />
                  <div className="flex flex-col truncate space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">名称: {fileInfo.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">大小: {formatFileSize(fileInfo.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearState}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
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
              {processMode === 'encrypt' ? 'Public Key' : 'Private Key or Mnemonic'}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {processMode === 'encrypt'
                      ? 'Enter a Base58 public key for encryption (approx. 44-45 characters)'
                      : 'Enter a 64-character hex private key or mnemonic phrase for decryption'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <PasswordInput
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={processMode === 'encrypt' ? 'Enter Base58 public key (approx. 44-45 characters)' : 'Enter private key (64 hex) or mnemonic phrase'}
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

      {inputType === 'file' && encryptedData && (
        <div className="bg-white dark:bg-gray-800 rounded-md border-2 border-dashed border-border p-4 space-y-4">
          <div className="px-2 py-4 rounded-md flex justify-between items-center bg-stone-100">
            <div className="flex items-center truncate space-x-3">
              <FileText className="w-14 h-14 text-blue-500" />
              <div className="flex flex-col truncate space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Name: {fileInfo?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Size: {formatFileSize(fileInfo?.size || 0)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pl-4">
              <span
                className={cn(
                  'text-sm whitespace-nowrap',
                  processMode === 'encrypt'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-green-600 dark:text-green-400'
                )}
              >
                {processMode === 'encrypt' ? 'Encrypted' : 'Decrypted'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
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
