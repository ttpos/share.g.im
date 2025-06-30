/* eslint-disable no-unused-vars */

'use client'

import { detect, isBase58String, validateBase58PublicKey } from '@ttpos/share-utils'
import { createContext, useContext, useRef, useState, type ReactNode, useEffect } from 'react'
import { toast } from 'sonner'

export const ENCRYPTION_MODES = {
  KEY_ENCRYPTION: 'keyEncryption',
  PASSWORD_ENCRYPTION: 'passwordEncryption'
} as const

type EncryptionMode = typeof ENCRYPTION_MODES[keyof typeof ENCRYPTION_MODES]

interface AppStateContextType {
  appState: 'select' | 'encrypt'
  fileMetadata: Awaited<ReturnType<typeof detect>> | null
  selectedFile: File | null
  textContent: string | null
  selectedEncryptionMode: EncryptionMode
  processMode: 'encrypt' | 'decrypt' | null
  initialKey: string | null
  setAppState: (state: 'select' | 'encrypt') => void
  setSelectedEncryptionMode: (mode: EncryptionMode) => void
  setProcessMode: (mode: 'encrypt' | 'decrypt' | null) => void
  setInitialKey: (key: string | null) => void
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handlePasteText: () => void
  handleReset: () => void
  triggerFileInput: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [appState, setAppState] = useState<'select' | 'encrypt'>('select')
  const [fileMetadata, setFileMetadata] = useState<Awaited<ReturnType<typeof detect>> | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [selectedEncryptionMode, setSelectedEncryptionMode] = useState<EncryptionMode>(ENCRYPTION_MODES.KEY_ENCRYPTION)
  const [processMode, setProcessMode] = useState<'encrypt' | 'decrypt' | null>(null)
  const [initialKey, setInitialKey] = useState<string | null>(null)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '')
      if (hash.startsWith('pub/')) {
        const pubKey = hash.substring(4)
        if (pubKey && isBase58String(pubKey)) {
          const validation = validateBase58PublicKey(pubKey)
          if (validation.isValid) {
            setInitialKey(pubKey)
            setSelectedEncryptionMode(ENCRYPTION_MODES.KEY_ENCRYPTION)
            setProcessMode('encrypt')
          } else {
            setInitialKey(null)
          }
        } else {
          setInitialKey(null)
        }
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setSelectedFile(file)
        setTextContent(null)
        const metadata = await detect(file)
        setFileMetadata(metadata)

        if (metadata.encryptionType === 'pubk') {
          if (selectedEncryptionMode !== ENCRYPTION_MODES.KEY_ENCRYPTION) {
            toast.info('Detected public key encrypted file, switching to Key Encryption mode')
            setSelectedEncryptionMode(ENCRYPTION_MODES.KEY_ENCRYPTION)
          }
          setProcessMode(file.name.endsWith('.enc') ? 'decrypt' : 'encrypt')
        } else if (metadata.encryptionType === 'pwd') {
          if (selectedEncryptionMode !== ENCRYPTION_MODES.PASSWORD_ENCRYPTION) {
            toast.info('Detected password encrypted file, switching to Password Encryption mode')
            setSelectedEncryptionMode(ENCRYPTION_MODES.PASSWORD_ENCRYPTION)
          }
          setProcessMode(file.name.endsWith('.enc') ? 'decrypt' : 'encrypt')
        } else if (metadata.encryptionType === 'signed') {
          toast.error('Signed files are not supported yet')
          handleReset()
          return
        } else {
          setProcessMode('encrypt')
        }

        setAppState('encrypt')
      } catch (error) {
        console.error('File detection failed:', error)
        toast.error('Failed to process file')
        handleReset()
      }
    }
  }

  const handlePasteText = async () => {
    setSelectedFile(null)
    setTextContent('')
    setFileMetadata(null)
    setProcessMode('encrypt')
    setAppState('encrypt')
  }

  const handleReset = () => {
    setAppState('select')
    setFileMetadata(null)
    setSelectedFile(null)
    setTextContent(null)
    setProcessMode(null)
    setInitialKey(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <AppStateContext.Provider
      value={{
        appState,
        fileMetadata,
        selectedFile,
        textContent,
        selectedEncryptionMode,
        processMode,
        initialKey,
        setAppState,
        setSelectedEncryptionMode,
        setProcessMode,
        setInitialKey,
        handleFileSelect,
        handlePasteText,
        handleReset,
        triggerFileInput
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
