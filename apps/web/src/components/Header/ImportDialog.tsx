/* eslint-disable no-unused-vars */
import { Button, Label, CustomOtpInput } from '@ttpos/share-ui'
import { verifyPasswordFn } from '@ttpos/share-utils'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { PublicKey, KeyPair } from '@/types'

interface ImportDialogProps {
  selectedFile: File | null
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onCancel: () => void
  // Add props for actual data import
  setPublicKeys?: (keys: PublicKey[]) => void
  setKeyPairs?: (keyPairs: KeyPair[]) => void
  setStoredPasswordHash?: (hash: string | null) => void
}

interface BackupData {
  version: string
  timestamp: string
  publicKeys: PublicKey[]
  keyPairs: KeyPair[]
  passwordHash: string | null
}

interface EncryptedBackupFile {
  data: string // encrypted data
  passwordHash: string // password hash for verification
  version: string
}

export const ImportDialog = ({
  selectedFile,
  onFileSelect,
  onImport,
  onCancel,
  setPublicKeys,
  setKeyPairs,
  setStoredPasswordHash
}: ImportDialogProps) => {
  const [importPassword, setImportPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEncryptedFile, setIsEncryptedFile] = useState(false)
  const [backupData, setBackupData] = useState<EncryptedBackupFile | BackupData | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize crypto worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/cryptoWorker.ts', import.meta.url))
    return () => workerRef.current?.terminate()
  }, [])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!selectedFile) {
      setImportPassword('')
      setIsEncryptedFile(false)
      setBackupData(null)
      setIsProcessing(false)
    }
  }, [selectedFile])

  // Analyze selected file to determine if it's encrypted
  useEffect(() => {
    const analyzeFile = async () => {
      if (!selectedFile) {
        setIsEncryptedFile(false)
        setBackupData(null)
        return
      }

      try {
        const fileContent = await selectedFile.text()
        const parsedData = JSON.parse(fileContent)

        // Check if it's new encrypted format
        if (parsedData.data && parsedData.passwordHash && parsedData.version) {
          setIsEncryptedFile(true)
          setBackupData(parsedData as EncryptedBackupFile)
        }
        // Check if it's old unencrypted format
        else if (parsedData.version && parsedData.timestamp && Array.isArray(parsedData.publicKeys) && Array.isArray(parsedData.keyPairs)) {
          setIsEncryptedFile(false)
          setBackupData(parsedData as BackupData)
        }
        else {
          throw new Error('Invalid backup file format')
        }
      } catch (error) {
        console.error('Failed to analyze backup file:', error)
        toast.error('Invalid backup file format')
        setIsEncryptedFile(false)
        setBackupData(null)
      }
    }

    analyzeFile()
  }, [selectedFile])

  const handleImport = useCallback(async () => {
    if (!selectedFile || !backupData) {
      toast.error('Please select a valid backup file')
      return
    }

    // For encrypted files, require password
    if (isEncryptedFile && (!importPassword || importPassword.length !== 6)) {
      toast.error('Please enter the 6-digit import password')
      return
    }

    setIsProcessing(true)

    try {
      let finalBackupData: BackupData

      if (isEncryptedFile) {
        const encryptedData = backupData as EncryptedBackupFile

        // Verify password first
        const isPasswordValid = await verifyPasswordFn(encryptedData.passwordHash, importPassword)
        if (!isPasswordValid) {
          toast.error('Invalid import password')
          setIsProcessing(false)
          return
        }

        // Decrypt using crypto worker
        const worker = workerRef.current
        if (!worker) throw new Error('Web Worker not initialized')

        const decryptedData = await new Promise<string>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent) => {
            const { data, error } = e.data
            if (error) {
              reject(new Error(error))
            } else if (data?.base64) {
              resolve(data.base64)
            }
          }

          worker.postMessage({
            mode: 'decrypt',
            encryptionMode: 'pwd',
            text: encryptedData.data,
            password: importPassword,
            isTextMode: true
          })
        })

        finalBackupData = JSON.parse(decryptedData)
      } else {
        // Use unencrypted data directly
        finalBackupData = backupData as BackupData
      }

      // Validate backup data structure
      if (!finalBackupData.version || !finalBackupData.timestamp) {
        throw new Error('Invalid backup file format')
      }

      if (setPublicKeys) {
        setPublicKeys(finalBackupData.publicKeys || [])
      }
      if (setKeyPairs) {
        setKeyPairs(finalBackupData.keyPairs || [])
      }
      if (setStoredPasswordHash) {
        setStoredPasswordHash(finalBackupData.passwordHash)
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      toast.success('Backup imported successfully!')

      setImportPassword('')
      setIsEncryptedFile(false)
      setBackupData(null)
      onImport()

    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import backup. Please check the file and password.')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFile, backupData, isEncryptedFile, importPassword, setPublicKeys, setKeyPairs, setStoredPasswordHash, onImport])

  // Handle file area click
  const handleFileAreaClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }, [])

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 sm:h-10 sm:w-10">
          <ChevronLeft className="size-3 sm:size-4" />
        </Button>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Import Data</h2>
      </div>

      <div className="flex justify-center text-center pt-1 sm:pt-2 pb-4 sm:pb-6">
        <div className="w-full sm:w-3/4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <input type="file" id="file-input" ref={fileInputRef} className="hidden" accept=".enc,.json" onChange={onFileSelect} />
          {!selectedFile ? (
            <div
              className="flex flex-col items-center justify-center p-3 sm:p-6 border-1 border-dashed rounded-md cursor-pointer transition-all py-4 sm:py-6 md:py-8 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
              onClick={handleFileAreaClick}
            >
              <Image src="/FileText.svg" alt="File Icon" width={32} height={32} className="size-8 sm:size-10 md:size-12 text-blue-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 md:mb-6 px-2">
                Select the backup file you previously saved to restore your data.
              </p>
              <Button
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
                onClick={(e) => { e.stopPropagation(); handleFileAreaClick() }}
              >
                Select Backup File
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div
                className="flex flex-col items-center justify-center p-3 sm:p-6 bg-gray-100 dark:bg-gray-700 rounded-md py-3 sm:py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={handleFileAreaClick}
              >
                <Image src="/FileTextEnc.svg" alt="File Icon" width={32} height={32} className="size-8 sm:size-10 md:size-12 text-blue-500 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium break-all px-2 text-center">
                  {selectedFile.name}
                </p>
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm px-2 py-1"
                  onClick={(e) => { e.stopPropagation(); handleFileAreaClick() }}
                >
                  Change File
                </Button>
              </div>

              {isEncryptedFile && (
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="import-password" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Import Password (6 digits)
                  </Label>
                  <div className="flex justify-center min-w-max">
                    <CustomOtpInput
                      length={6}
                      value={importPassword}
                      onChange={setImportPassword}
                      id="import-password"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4">
                    Enter the password you used when creating this backup
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pb-3 sm:pb-4 md:pb-6 px-2 sm:px-0">
          <Button
            variant="outline"
            className="w-full sm:w-auto order-2 sm:order-1 text-sm py-2.5"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2 text-sm py-2.5"
            disabled={!selectedFile || !backupData || (isEncryptedFile && importPassword.length !== 6) || isProcessing}
            onClick={handleImport}
          >
            {isProcessing ? 'Importing...' : 'Import'}
          </Button>
        </div>
      )}
    </div>
  )
}
