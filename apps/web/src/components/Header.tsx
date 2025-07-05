/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
'use client'

import {
  Button,
  Label,
  Input,
  CustomOtpInput,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  RadioGroup,
  RadioGroupItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Alert,
  AlertTitle
} from '@ttpos/share-ui'
import {
  isBase58String,
  validateBase58PublicKey,
  sliceAddress,
  hashPasswordFn,
  verifyPasswordFn
} from '@ttpos/share-utils'
import { Settings, Lock, X, Copy, Pencil, Trash2, Info, ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

// Constants definition
const TABS = ['General', 'Keys', 'External Public Keys', 'Security Password'] as const
const STORAGE_KEYS = {
  PUBLIC_KEYS: 'externalPublicKeys',
  PASSWORD_HASH: 'passwordHash'
} as const

// Type definitions
interface PublicKey {
  publicKey: string
  note: string
  index?: number
}

type TabType = typeof TABS[number]

interface ValidationResult {
  isValid: boolean
  error?: string
}

// Custom hooks
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setValue(JSON.parse(stored))
      }
      setIsLoaded(true)
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error)
      toast.error('Failed to load data from storage')
      setIsLoaded(true)
    }
  }, [key])

  const setStoredValue = useCallback((newValue: T) => {
    try {
      setValue(newValue)
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error)
      toast.error('Failed to save data to storage')
    }
  }, [key])

  const removeStoredValue = useCallback(() => {
    try {
      setValue(initialValue)
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error)
      toast.error('Failed to remove data from storage')
    }
  }, [key, initialValue])

  return [value, setStoredValue, removeStoredValue, isLoaded] as const
}

// Validation functions
const validatePublicKey = (publicKey: string): ValidationResult => {
  if (!publicKey) {
    return { isValid: false, error: 'Please enter a public key' }
  }

  if (!isBase58String(publicKey)) {
    return { isValid: false, error: 'Invalid public key format. Must be a Base58 string.' }
  }

  const validation = validateBase58PublicKey(publicKey)
  if (!validation.isValid) {
    return { isValid: false, error: validation.error || 'Public key validation failed. Please check your input.' }
  }

  return { isValid: true }
}

const validatePasswords = (newPassword: string, confirmPassword: string): ValidationResult => {
  if (!newPassword) {
    return { isValid: false, error: 'Please enter a new password' }
  }
  if (!confirmPassword) {
    return { isValid: false, error: 'Please enter the confirm password' }
  }
  if (newPassword !== confirmPassword) {
    return { isValid: false, error: 'The two passwords are inconsistent, please re-enter' }
  }
  return { isValid: true }
}

// Sub components
const ThemeSelector = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</h3>
      <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {['system', 'light', 'dark'].map((themeOption) => (
          <div key={themeOption} className="flex items-center space-x-2">
            <RadioGroupItem
              value={themeOption}
              id={themeOption}
              className="border-gray-300 dark:border-gray-600 h-4 w-4 sm:h-5 sm:w-5"
            />
            <Label htmlFor={themeOption} className="text-xs sm:text-sm capitalize">
              {themeOption}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

const PublicKeyForm = ({
  editKey,
  validationError,
  onPublicKeyChange,
  onNoteChange,
  onSave,
  onCancel
}: {
  editKey: PublicKey | null
  validationError: string
  onPublicKeyChange: (value: string) => void
  onNoteChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}) => (
  <div className="w-full pb-4 sm:pb-6">
    <div className="w-full sm:w-3/4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="publicKey" className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Public Key
        </Label>
        <Input
          id="publicKey"
          type="text"
          value={editKey?.publicKey || ''}
          onChange={(e) => onPublicKeyChange(e.target.value)}
          className={cn(
            'w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border',
            validationError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200'
          )}
          placeholder="Enter Base58 public key (approx. 44-45 characters)"
        />
        {validationError && (
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{validationError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note" className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Note
        </Label>
        <Input
          id="note"
          type="text"
          value={editKey?.note || ''}
          onChange={(e) => onNoteChange(e.target.value)}
          className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
          placeholder="Optional note for this public key"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onSave}
          disabled={!editKey?.publicKey}
        >
          {editKey?.index !== undefined ? 'Update Public Key' : 'Add Public Key'}
        </Button>
      </div>
    </div>
  </div>
)

const PublicKeyTable = ({
  publicKeys,
  onCopy,
  onEditNote,
  onDelete,
  onSaveNote
}: {
  publicKeys: PublicKey[]
  onCopy: (address: string) => void
  onEditNote: (key: PublicKey, index: number) => void
  onDelete: (index: number) => void
  onSaveNote: (index: number, note: string) => void
}) => {
  const [isNotePopoverOpen, setIsNotePopoverOpen] = useState(false)
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingNote, setEditingNote] = useState('')

  const handleEditNote = (key: PublicKey, index: number) => {
    setEditingIndex(index)
    setEditingNote(key.note || '')
    setIsNotePopoverOpen(true)
  }

  const handleSaveNote = () => {
    if (editingIndex !== null) {
      onSaveNote(editingIndex, editingNote)
      setIsNotePopoverOpen(false)
      setEditingIndex(null)
      setEditingNote('')
    }
  }

  const handleCancelNote = () => {
    setIsNotePopoverOpen(false)
    setEditingIndex(null)
    setEditingNote('')
  }

  const handleDeleteClick = (index: number) => {
    setEditingIndex(index)
    setIsDeletePopoverOpen(true)
  }

  const handleConfirmDelete = () => {
    if (editingIndex !== null) {
      onDelete(editingIndex)
      setIsDeletePopoverOpen(false)
      setEditingIndex(null)
    }
  }

  const handleCancelDelete = () => {
    setIsDeletePopoverOpen(false)
    setEditingIndex(null)
  }

  return (
    <div className="overflow-x-auto pb-4 sm:pb-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 sm:p-3 text-left">Public Key</TableHead>
            <TableHead className="p-2 sm:p-3 text-left w-3/5 truncate">Note</TableHead>
            <TableHead className="p-2 sm:p-3 text-left"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publicKeys.map((key, index) => (
            <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 text-gray-500 font-normal">
              <TableCell>
                <div className="flex items-center gap-2">
                  {sliceAddress(key.publicKey)}
                  <Button variant="ghost" size="icon" onClick={() => onCopy(key.publicKey)}>
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-30 sm:max-w-40">
                    {key.note || '---'}
                  </span>
                  <Popover open={isNotePopoverOpen && editingIndex === index} onOpenChange={(open) => !open && handleCancelNote()}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleEditNote(key, index)}>
                        <Pencil className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[90vw] sm:w-80">
                      <div className="space-y-4">
                        <Label htmlFor="editNote" className="text-sm font-medium text-gray-900 dark:text-gray-100">Edit Note</Label>
                        <Input
                          id="editNote"
                          type="text"
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
                          placeholder="Optional note for this public key"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={handleCancelNote}>
                            Cancel
                          </Button>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveNote}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>
              <TableCell>
                <Popover open={isDeletePopoverOpen && editingIndex === index} onOpenChange={(open) => !open && handleCancelDelete()}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(index)}>
                      <Trash2 className="size-4 sm:size-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] sm:w-80">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Info className="size-3 sm:size-4 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Delete Public Key</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete this public key? This action cannot be undone.
                      </p>
                      <div className="flex justify-end gap-2 sm:gap-3">
                        <Button variant="outline" onClick={handleCancelDelete}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function Header() {
  // Main state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('General')
  const [showMobileNav, setShowMobileNav] = useState(false)

  // Import related state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Public key management state
  const [publicKeys, setPublicKeys, removePublicKeys] = useLocalStorage<PublicKey[]>(STORAGE_KEYS.PUBLIC_KEYS, [])
  const [showAddKey, setShowAddKey] = useState(false)
  const [editKey, setEditKey] = useState<PublicKey | null>(null)
  const [validationError, setValidationError] = useState('')

  // Password management state
  const [storedPasswordHash, setStoredPasswordHash, removePasswordHash] = useLocalStorage<string | null>(STORAGE_KEYS.PASSWORD_HASH, null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState('')

  // Popover state
  const [isResetPopoverOpen, setIsResetPopoverOpen] = useState(false)

  // Computed properties
  const isPasswordSet = Boolean(storedPasswordHash)

  // Password validation effect
  useEffect(() => {
    if (!storedPasswordHash || currentPassword.length !== 6) {
      setCurrentPasswordError('')
      return
    }

    const validatePassword = async () => {
      try {
        const isValid = await verifyPasswordFn(storedPasswordHash, currentPassword)
        setCurrentPasswordError(isValid ? '' : 'Current password is incorrect')
        if (!isValid) toast.error('Current password is incorrect')
      } catch (error) {
        console.error('Password verification failed:', error)
        setCurrentPasswordError('Failed to verify current password')
        toast.error('Failed to verify current password')
      }
    }

    validatePassword()
  }, [currentPassword, storedPasswordHash])

  // Reset all states function
  const resetAllStates = useCallback(() => {
    setShowImportDialog(false)
    setSelectedFile(null)
    setShowAddKey(false)
    setEditKey(null)
    setShowChangePassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setValidationError('')
    setCurrentPasswordError('')
    setIsResetPopoverOpen(false)
  }, [])

  // Tab click handler
  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab)
    setShowMobileNav(false)
    resetAllStates()
    // If switching to Security Password and no password is set, show password setup interface
    if (tab === 'Security Password' && !isPasswordSet) {
      setShowChangePassword(true)
    }
  }, [isPasswordSet, resetAllStates])

  // File handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
  }, [])

  const handleImport = useCallback(() => {
    setShowImportDialog(false)
    setSelectedFile(null)
    toast.success('Import completed successfully')
  }, [])

  // Account reset
  const handleReset = useCallback(() => {
    removePublicKeys()
    removePasswordHash()
    setIsResetPopoverOpen(false)
    toast.success('Account reset successfully. All data cleared.')
  }, [removePublicKeys, removePasswordHash])

  // Public key management
  const handleSaveKey = useCallback(() => {
    if (!editKey) return

    const validation = validatePublicKey(editKey.publicKey)
    if (!validation.isValid) {
      setValidationError(validation.error!)
      toast.error(validation.error!)
      return
    }

    const newPublicKeys = [...publicKeys]
    if (editKey.index !== undefined) {
      newPublicKeys[editKey.index] = { publicKey: editKey.publicKey, note: editKey.note || '' }
    } else {
      newPublicKeys.push({ publicKey: editKey.publicKey, note: editKey.note || '' })
    }

    setPublicKeys(newPublicKeys)
    toast.success('Public key saved successfully')
    setShowAddKey(false)
    setEditKey(null)
    setValidationError('')
  }, [editKey, publicKeys, setPublicKeys])

  const handleDeleteKey = useCallback((index: number) => {
    const newPublicKeys = publicKeys.filter((_, i) => i !== index)
    setPublicKeys(newPublicKeys)
    toast.success('Public key deleted successfully')
  }, [publicKeys, setPublicKeys])

  const handleCopy = useCallback((address: string) => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Public key copied to clipboard')
    } else {
      toast.error('Public key is empty, cannot copy')
    }
  }, [])

  // Password management
  const handleSetOrChangePassword = useCallback(async () => {
    const passwordValidation = validatePasswords(newPassword, confirmPassword)
    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.error!)
      toast.error(passwordValidation.error!)
      return
    }

    if (isPasswordSet && currentPasswordError) {
      toast.error('Please enter a valid current password')
      return
    }

    try {
      const hashedPassword = await hashPasswordFn(newPassword)
      setStoredPasswordHash(hashedPassword)
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setValidationError('')
      setCurrentPasswordError('')
      toast.success(isPasswordSet ? 'Password updated successfully' : 'Password set successfully')
    } catch (error) {
      console.error('Failed to save password:', error)
      setValidationError('Failed to save password. Please try again.')
      toast.error('Failed to save password. Please try again.')
    }
  }, [newPassword, confirmPassword, isPasswordSet, currentPasswordError, setStoredPasswordHash])

  // Dialog close handler
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    resetAllStates()
  }, [resetAllStates])

  // Public key operations
  const handleAddPublicKey = useCallback(() => {
    setEditKey({ publicKey: '', note: '' })
    setShowAddKey(true)
    setValidationError('')
  }, [])

  const handleEditNote = useCallback((key: PublicKey, index: number) => {
    setEditKey({ ...key, index })
  }, [])

  const handleSaveNoteInTable = useCallback((index: number, note: string) => {
    const newPublicKeys = [...publicKeys]
    newPublicKeys[index] = {
      publicKey: newPublicKeys[index]?.publicKey || '',
      note
    }
    setPublicKeys(newPublicKeys)
    toast.success('Note updated successfully')
  }, [publicKeys, setPublicKeys])

  // Backup handling
  const handleBackup = useCallback(() => {
    // 实现备份逻辑
    toast.success('Backup created successfully')
  }, [])

  // Input change handlers
  const handlePublicKeyChange = useCallback((value: string) => {
    setEditKey(prev => ({ ...prev || { publicKey: '', note: '' }, publicKey: value }))
    setValidationError('')
  }, [])

  const handleNoteChange = useCallback((value: string) => {
    setEditKey(prev => ({ ...prev || { publicKey: '', note: '' }, note: value }))
  }, [])

  // Render import dialog
  const renderImportDialog = () => (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setShowImportDialog(false)}>
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Data</h2>
      </div>
      <div className="flex justify-center text-center pt-2 pb-6">
        <div className="w-full sm:w-3/4 bg-white dark:bg-gray-800 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-4 sm:p-6">
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center p-3 sm:p-6 border-1 border-dashed rounded-md cursor-pointer transition-all py-6 sm:py-8 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500">
              <Image src="/FileText.svg" alt="File Icon" width={40} height={40} className="size-10 sm:size-12 text-blue-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Select the backup file you previously saved to restore your data.
              </p>
              <input type="file" id="file-input" className="hidden" accept=".enc" onChange={handleFileSelect} />
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" onClick={() => document.getElementById('file-input')?.click()}>
                Select Backup File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-3 sm:p-6 bg-gray-100 rounded-md cursor-pointer transition-all py-6 sm:py-8 border-gray-300 dark:border-gray-600">
              <Image src="/FileTextEnc.svg" alt="File Icon" width={40} height={40} className="size-10 sm:size-12 text-blue-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">{selectedFile.name}</p>
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 mt-2 text-sm sm:text-base" onClick={() => document.getElementById('file-input')?.click()}>
                Change File
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center gap-3 pb-4 sm:pb-6">
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowImportDialog(false)}>
          Cancel
        </Button>
        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedFile} onClick={handleImport}>
          Import
        </Button>
      </div>
    </div>
  )

  // Render add key dialog
  const renderAddKeyDialog = () => (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setShowAddKey(false)}>
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">External Public Keys</h2>
      </div>
      <div className="flex justify-center text-center pt-2 pb-6">
        <PublicKeyForm
          editKey={editKey}
          validationError={validationError}
          onPublicKeyChange={handlePublicKeyChange}
          onNoteChange={handleNoteChange}
          onSave={handleSaveKey}
          onCancel={() => setShowAddKey(false)}
        />
      </div>
    </div>
  )

  // Render tab content
  const renderTabContent = () => {
    if (showImportDialog) return renderImportDialog()
    if (showAddKey) return renderAddKeyDialog()

    switch (activeTab) {
      case 'General':
        return (
          <div className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">General</h2>

              <ThemeSelector />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Back Up Data</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Back up your keys and external public keys.
                  </p>
                </div>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" onClick={handleBackup}>
                  Export
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Import Data</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Import backup data to restore keys and external public keys.
                  </p>
                </div>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowImportDialog(true)}>
                  Import
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-2 sm:gap-0">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Reset Account</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Resetting the account will delete all locally stored data. This action cannot be undone.
                  </p>
                </div>
                <Popover open={isResetPopoverOpen} onOpenChange={setIsResetPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">Reset</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] sm:w-80">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Info className="size-3 sm:size-4 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Reset Account</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Resetting the account will delete all locally stored data. Please make sure you have
                        backed up your key file (.enc). This action cannot be undone.
                      </p>
                      <div className="flex justify-end gap-2 sm:gap-3">
                        <Button variant="outline" onClick={() => setIsResetPopoverOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReset}>
                          Reset
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )

      case 'External Public Keys':
        return (
          <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">External Public Keys</h2>
              {publicKeys.length > 0 && (
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddPublicKey}>
                  Add External Public Key
                </Button>
              )}
            </div>

            {publicKeys.length === 0 ? (
              <div className="flex flex-col items-center pt-10 pb-20">
                <Image src="/PublicKeys.svg" alt="No Keys Icon" width={40} height={40} className="size-10 sm:size-12 text-blue-500 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                  Add an external public key to encrypt files or text.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddPublicKey}>
                  Add External Public Key
                </Button>
              </div>
            ) : (
              <PublicKeyTable
                publicKeys={publicKeys}
                onCopy={handleCopy}
                onEditNote={handleEditNote}
                onDelete={handleDeleteKey}
                onSaveNote={handleSaveNoteInTable}
              />
            )}
          </div>
        )

      case 'Security Password':
        return (
          <div className="p-4 sm:p-6">
            {showChangePassword || !isPasswordSet ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security Password</h2>
                  {isPasswordSet && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 cursor-pointer">
                          Forgot password
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[90vw] sm:w-80">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Forgot your password? Just
                          <span className="px-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 cursor-pointer" onClick={() => handleTabClick('General')}>
                            reset your account
                          </span>
                          to start over. Don't forget to back up your data first.
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="flex justify-center text-center pt-2 pb-6">
                  <div className="w-full pb-4 sm:pb-6 space-y-4">
                    {!isPasswordSet && (
                      <Alert className="flex bg-[#E6F0FF]">
                        <AlertTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          You haven't set a security password yet. To protect your account, please set one now.
                        </AlertTitle>
                      </Alert>
                    )}

                    <div className="w-full sm:w-3/4 space-y-4">
                      {isPasswordSet && (
                        <div className="space-y-2">
                          <Label htmlFor="current-password-otp-input-0" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Current Password
                          </Label>
                          <CustomOtpInput
                            length={6}
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            id="current-password-otp-input"
                            disabled={!isPasswordSet}
                            error={!!currentPasswordError}
                          />
                          {currentPasswordError && (
                            <p className="text-left text-xs sm:text-sm text-red-600 dark:text-red-400">
                              {currentPasswordError}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="new-password-otp-input-0" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {isPasswordSet ? 'New Password' : 'Set your Password'}
                        </Label>
                        <CustomOtpInput
                          length={6}
                          value={newPassword}
                          onChange={setNewPassword}
                          id="new-password-otp-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password-otp-input-0" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {isPasswordSet ? 'Confirm New Password' : 'Confirm Password'}
                        </Label>
                        <CustomOtpInput
                          length={6}
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          id="confirm-password-otp-input"
                          error={!!(newPassword && confirmPassword && newPassword !== confirmPassword)}
                        />
                      </div>

                      {(validationError || (newPassword && confirmPassword && newPassword !== confirmPassword)) && (
                        <p className="text-left text-xs sm:text-sm text-red-600 dark:text-red-400">
                          {validationError || 'The two passwords are inconsistent, please re-enter'}
                        </p>
                      )}

                      <div className="flex">
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleSetOrChangePassword}
                          disabled={
                            !newPassword ||
                            !confirmPassword ||
                            (isPasswordSet && !currentPassword) ||
                            (isPasswordSet && !!currentPasswordError) ||
                            newPassword !== confirmPassword
                          }
                        >
                          Save {!isPasswordSet && 'Password'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isPasswordSet ? (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Security Password</h2>
                <div className="flex flex-col items-start space-y-4 sm:space-y-6 pb-4 sm:pb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Your Security Password</h3>
                  <Input type="password" readOnly value="******" />
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowChangePassword(true)}>
                    Change
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )

      default:
        return (
          <div className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{activeTab}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Content for {activeTab} section will be implemented here.
            </p>
          </div>
        )
    }
  }

  return (
    <header className="relative w-full py-6 z-10 bg-[#0052D9] dark:bg-[#0E0F11] text-white dark:text-gray-200 overflow-hidden">
      <Lock className="hidden md:block absolute size-34 top-1/3 -left-12 text-[#4c85e4] dark:text-[#292929]" />

      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center md:justify-between gap-4 p-4">
        <div className="flex-1 text-center space-y-2">
          <Image
            src="/logo.svg"
            alt="Secure Vault Logo"
            width={80}
            height={40}
            className="size-10 sm:size-12 text-blue-500 mx-auto mb-2 block dark:hidden"
          />
          <Image
            src="/logo_dark.svg"
            alt="Secure Vault Logo"
            width={80}
            height={40}
            className="size-10 sm:size-12 text-blue-500 mx-auto mb-2 hidden dark:block"
          />
          <h3 className="text-sm md:text-base font-medium text-white dark:text-gray-300">
            ECIES File & Message Encryption Tool
          </h3>
        </div>

        <div className="flex items-center gap-2 justify-center md:justify-end w-full md:w-auto md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2">
          <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setIsDialogOpen(true)}>
            <Settings className="size-5" />
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[90vh] overflow-hidden gap-0 p-0" showClose={false}>
              <DialogHeader className="border-b p-4 bg-white dark:bg-gray-900">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setShowMobileNav(true)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Settings
                    </DialogTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseDialog}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar navigation */}
                <div className={cn(
                  'transition-transform duration-300 ease-in-out',
                  'md:relative md:translate-x-0 md:w-1/4 md:border-r md:border-gray-200 md:dark:border-gray-700',
                  'absolute inset-0 w-full bg-white dark:bg-gray-900 z-10',
                  showMobileNav && !showImportDialog && !showAddKey && !showChangePassword ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}>
                  <div className="p-6 h-full overflow-y-auto">
                    <nav className="space-y-1">
                      {TABS.map((tab) => (
                        <Button
                          key={tab}
                          variant="ghost"
                          className={cn(
                            'w-full justify-start text-sm h-auto py-2 px-3 font-normal',
                            activeTab === tab && 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          )}
                          onClick={() => handleTabClick(tab)}
                        >
                          {tab}
                        </Button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800">
                  {renderTabContent()}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
