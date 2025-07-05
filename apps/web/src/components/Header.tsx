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
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

// Type definitions
interface PublicKey {
  publicKey: string
  note: string
  index?: number
}

export default function Header() {
  const { theme, setTheme } = useTheme()
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('General')
  const [showMobileNav, setShowMobileNav] = useState<boolean>(false)
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isResetPopoverOpen, setIsResetPopoverOpen] = useState<boolean>(false)
  const [showAddKey, setShowAddKey] = useState<boolean>(false)
  const [editKey, setEditKey] = useState<PublicKey | null>(null)
  const [publicKeys, setPublicKeys] = useState<PublicKey[]>([])
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false)
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false)
  const [storedPasswordHash, setStoredPasswordHash] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string>('')
  const [currentPasswordError, setCurrentPasswordError] = useState<string>('')
  const [isNotePopoverOpen, setIsNotePopoverOpen] = useState<boolean>(false)
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState<boolean>(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const tabs: string[] = ['General', 'Keys', 'External Public Keys', 'Security Password']

  // Initialize publicKeys and password hash from localStorage
  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('externalPublicKeys')
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys)
        if (Array.isArray(parsedKeys)) {
          setPublicKeys(parsedKeys)
        }
      }
      const storedHash = localStorage.getItem('passwordHash')
      if (storedHash) {
        setStoredPasswordHash(storedHash)
        setIsPasswordSet(true)
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
      toast.error('Failed to load data. Please check browser storage settings.')
    }
  }, [])

  // Validate current password when it changes
  useEffect(() => {
    if (isPasswordSet && currentPassword.length === 6) {
      const validateCurrentPassword = async () => {
        try {
          const isValid = await verifyPasswordFn(storedPasswordHash!, currentPassword)
          if (!isValid) {
            setCurrentPasswordError('Current password is incorrect')
            toast.error('Current password is incorrect')
          } else {
            setCurrentPasswordError('')
          }
        } catch (error) {
          console.error('Failed to verify current password:', error)
          setCurrentPasswordError('Failed to verify current password')
          toast.error('Failed to verify current password')
        }
      }
      validateCurrentPassword()
    } else if (currentPassword.length < 6) {
      setCurrentPasswordError('')
    }
  }, [currentPassword, isPasswordSet, storedPasswordHash])

  // Handle tab navigation and reset states
  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    setShowMobileNav(false)
    setShowImportDialog(false)
    setShowAddKey(false)
    setEditKey(null)
    setShowChangePassword(tab === 'Security Password' && !isPasswordSet)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setValidationError('')
    setCurrentPasswordError('')
    setIsNotePopoverOpen(false)
    setIsDeletePopoverOpen(false)
    setDeleteIndex(null)
  }

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Handle import action
  const handleImport = () => {
    setShowImportDialog(false)
    setSelectedFile(null)
  }

  // Handle account reset
  const handleReset = () => {
    try {
      localStorage.removeItem('externalPublicKeys')
      localStorage.removeItem('passwordHash')
      setPublicKeys([])
      setStoredPasswordHash(null)
      setIsPasswordSet(false)
      setIsResetPopoverOpen(false)
      toast.success('Account reset successfully. All data cleared.')
    } catch (error) {
      console.error('Failed to reset account:', error)
      toast.error('Failed to reset account. Please check browser storage settings.')
    }
  }

  // Save or update public key
  const handleSaveKey = () => {
    if (!editKey?.publicKey) {
      setValidationError('Please enter a public key')
      toast.error('Please enter a public key')
      return
    }

    if (!isBase58String(editKey.publicKey)) {
      setValidationError('Invalid public key format. Must be a Base58 string.')
      toast.error('Invalid public key format. Must be a Base58 string.')
      return
    }

    const validation = validateBase58PublicKey(editKey.publicKey)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Public key validation failed. Please check your input.')
      toast.error(validation.error || 'Public key validation failed. Please check your input.')
      return
    }

    try {
      const newPublicKeys = [...publicKeys]
      if (editKey.index !== undefined) {
        newPublicKeys[editKey.index] = { publicKey: editKey.publicKey, note: editKey.note || '' }
      } else {
        newPublicKeys.push({ publicKey: editKey.publicKey, note: editKey.note || '' })
      }
      setPublicKeys(newPublicKeys)
      localStorage.setItem('externalPublicKeys', JSON.stringify(newPublicKeys))
      toast.success('Public key saved successfully')
      setShowAddKey(false)
      setEditKey(null)
      setValidationError('')
    } catch (error) {
      console.error('Failed to save public key to localStorage:', error)
      setValidationError('Failed to save public key. Please check browser storage settings.')
      toast.error('Failed to save public key. Please check browser storage settings.')
    }
  }

  // Delete public key
  const handleDeleteKey = (index: number) => {
    try {
      const newPublicKeys = publicKeys.filter((_, i) => i !== index)
      setPublicKeys(newPublicKeys)
      localStorage.setItem('externalPublicKeys', JSON.stringify(newPublicKeys))
      toast.success('Public key deleted successfully')
    } catch (error) {
      console.error('Failed to delete public key:', error)
      toast.error('Failed to delete public key. Please check browser storage settings.')
    }
    setIsDeletePopoverOpen(false)
    setDeleteIndex(null)
  }

  // Handle edit note
  const handleEditNote = (key: PublicKey, index: number) => {
    setEditKey({ ...key, index })
    setIsNotePopoverOpen(true)
  }

  // Handle save note
  const handleSaveNote = () => {
    if (editKey && editKey.index !== undefined) {
      try {
        const newPublicKeys = [...publicKeys]
        newPublicKeys[editKey.index] = { publicKey: editKey.publicKey, note: editKey.note || '' }
        setPublicKeys(newPublicKeys)
        localStorage.setItem('externalPublicKeys', JSON.stringify(newPublicKeys))
        toast.success('Note updated successfully')
        setIsNotePopoverOpen(false)
        setEditKey(null)
      } catch (error) {
        console.error('Failed to update note:', error)
        toast.error('Failed to update note. Please check browser storage settings.')
      }
    }
  }

  // Set or change security password
  const handleSetOrChangePassword = async () => {
    // Validate new password and confirm password
    if (!newPassword) {
      setValidationError('Please enter a new password')
      toast.error('Please enter a new password')
      return
    }
    if (!confirmPassword) {
      setValidationError('Please enter the confirm password')
      toast.error('Please enter the confirm password')
      return
    }
    if (newPassword !== confirmPassword) {
      setValidationError('The two passwords are inconsistent, please re-enter')
      toast.error('The two passwords are inconsistent, please re-enter')
      return
    }

    // Validate current password if changing password
    if (isPasswordSet && storedPasswordHash) {
      if (!currentPassword) {
        setCurrentPasswordError('Please enter the current password')
        toast.error('Please enter the current password')
        return
      }
      try {
        const isValid = await verifyPasswordFn(storedPasswordHash, currentPassword)
        if (!isValid) {
          setCurrentPasswordError('Current password is incorrect')
          toast.error('Current password is incorrect')
          return
        }
      } catch (error) {
        console.error('Password verification failed:', error)
        setCurrentPasswordError('Failed to verify current password')
        toast.error('Failed to verify current password')
        return
      }
    }

    // Save new password
    try {
      const hashedPassword = await hashPasswordFn(newPassword)
      localStorage.setItem('passwordHash', hashedPassword)
      setStoredPasswordHash(hashedPassword)
      setIsPasswordSet(true)
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
  }

  // Close settings dialog and reset all states
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setShowImportDialog(false)
    setSelectedFile(null)
    setIsResetPopoverOpen(false)
    setShowAddKey(false)
    setEditKey(null)
    setShowChangePassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setValidationError('')
    setCurrentPasswordError('')
    setIsNotePopoverOpen(false)
    setIsDeletePopoverOpen(false)
    setDeleteIndex(null)
  }

  // Handle add new public key
  const handleAddPublicKey = () => {
    setEditKey({ publicKey: '', note: '' })
    setShowAddKey(true)
    setValidationError('')
  }

  // Handle public key input change
  const handlePublicKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditKey({ ...editKey || { publicKey: '', note: '' }, publicKey: e.target.value })
    setValidationError('')
  }

  // Handle note input change
  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditKey({ ...editKey || { publicKey: '', note: '' }, note: e.target.value })
  }

  // Handle backup action
  const handleBackup = () => {
    // Implement backup logic here
  }

  const handleCopy = (address: string) => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Public key copied to clipboard')
    } else {
      toast.error('Public key is empty, cannot copy')
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
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => setIsDialogOpen(true)}
          >
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
                <div className={cn(
                  'transition-transform duration-300 ease-in-out',
                  'md:relative md:translate-x-0 md:w-1/4 md:border-r md:border-gray-200 md:dark:border-gray-700',
                  'absolute inset-0 w-full bg-white dark:bg-gray-900 z-10',
                  showMobileNav && !showImportDialog && !showAddKey && !showChangePassword ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}>
                  <div className="p-6 h-full overflow-y-auto">
                    <nav className="space-y-1">
                      {tabs.map((tab) => (
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

                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800">
                  {showImportDialog ? (
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowImportDialog(false)
                            setSelectedFile(null)
                          }}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">General</h2>
                      </div>
                      {!selectedFile ? (
                        <div className="flex justify-center text-center pt-2 pb-6">
                          <div className="w-full sm:w-3/4 bg-white dark:bg-gray-800 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-4 sm:p-6">
                            <div className="flex flex-col items-center justify-center p-3 sm:p-6 border-1 border-dashed rounded-md cursor-pointer transition-all py-6 sm:py-8 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500">
                              <Image
                                src="/FileText.svg"
                                alt="File Icon"
                                width={40}
                                height={40}
                                className="size-10 sm:size-12 text-blue-500 mx-auto mb-2"
                              />
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                                Select the backup file you previously saved to restore your data.
                              </p>
                              <input
                                type="file"
                                id="file-input"
                                className="hidden"
                                accept=".enc"
                                onChange={handleFileSelect}
                              />
                              <Button
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => document.getElementById('file-input')?.click()}
                              >
                                Select Backup File
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center text-center pt-2 pb-6">
                          <div className="w-full sm:w-3/4 bg-white dark:bg-gray-800 rounded-md backdrop-blur-sm border-1 border-blue-400 dark:border-blue-500 p-4 sm:p-6">
                            <div className="flex flex-col items-center justify-center p-3 sm:p-6 bg-gray-100 rounded-md cursor-pointer transition-all py-6 sm:py-8 border-gray-300 dark:border-gray-600">
                              <Image
                                src="/FileTextEnc.svg"
                                alt="File Icon"
                                width={40}
                                height={40}
                                className="size-10 sm:size-12 text-blue-500 mx-auto mb-2"
                              />
                              <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {selectedFile.name}
                              </p>
                              <Button
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700 mt-2 text-sm sm:text-base"
                                onClick={() => document.getElementById('file-input')?.click()}
                              >
                                Change File
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center gap-3 pb-4 sm:pb-6">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setShowImportDialog(false)
                            setSelectedFile(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!selectedFile}
                          onClick={handleImport}
                        >
                          Import
                        </Button>
                      </div>
                    </div>
                  ) : showAddKey ? (
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowAddKey(false)
                            setEditKey(null)
                            setValidationError('')
                          }}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">External Public Keys</h2>
                      </div>
                      <div className="flex justify-center text-center pt-2 pb-6">
                        <div className="w-full pb-4 sm:pb-6">
                          <div className="w-full sm:w-3/4 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="publicKey" className="text-sm font-medium text-gray-900 dark:text-gray-100">Public Key</Label>
                              <Input
                                id="publicKey"
                                type="text"
                                value={editKey?.publicKey || ''}
                                onChange={handlePublicKeyChange}
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
                              <Label htmlFor="note" className="text-sm font-medium text-gray-900 dark:text-gray-100">Note</Label>
                              <Input
                                id="note"
                                type="text"
                                value={editKey?.note || ''}
                                onChange={handleNoteChange}
                                className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
                                placeholder="Optional note for this public key"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowAddKey(false)
                                  setEditKey(null)
                                  setValidationError('')
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleSaveKey}
                                disabled={!editKey?.publicKey}
                              >
                                {editKey?.index !== undefined ? 'Update Public Key' : 'Add Public Key'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'Security Password' ? (
                    <div className="p-4 sm:p-6">
                      {showChangePassword ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Security Password
                              </h2>
                            </div>
                            {isPasswordSet && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 cursor-pointer"
                                  >
                                    Forgot password
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[90vw] sm:w-80">
                                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    Forgot your password? Just
                                    <span
                                      className="px-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 cursor-pointer"
                                      onClick={() => handleTabClick('General')}
                                    >
                                      reset your account
                                    </span>
                                    to start over. Don’t forget to back up your data first.
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
                                    You haven’t set a security password yet. To protect your account, please set one now.
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
                            <div className="flex gap-3 w-full sm:w-auto">
                              <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => setShowChangePassword(true)}
                              >
                                Change
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                  ) : activeTab === 'General' ? (
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4 sm:space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">General</h2>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</h3>
                          <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="system"
                                id="system"
                                className={cn('border-gray-300 dark:border-gray-600 h-4 w-4 sm:h-5 sm:w-5')}
                              />
                              <Label htmlFor="system" className="text-xs sm:text-sm">System</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="light"
                                id="light"
                                className={cn('border-gray-300 dark:border-gray-600 h-4 w-4 sm:h-5 sm:w-5')}
                              />
                              <Label htmlFor="light" className="text-xs sm:text-sm">Light</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="dark"
                                id="dark"
                                className={cn('border-gray-300 dark:border-gray-600 h-4 w-4 sm:h-5 sm:w-5')}
                              />
                              <Label htmlFor="dark" className="text-xs sm:text-sm">Dark</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Back Up Data</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Back up your keys and external public keys.
                            </p>
                          </div>
                          <Button
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleBackup}
                          >
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
                          <Button
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setShowImportDialog(true)}
                          >
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
                              <Button
                                variant="destructive"
                                className="w-full sm:w-auto"
                              >
                                Reset
                              </Button>
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
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsResetPopoverOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleReset}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'External Public Keys' ? (
                    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">External Public Keys</h2>
                        {publicKeys.length > 0 && (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleAddPublicKey}
                          >
                            Add External Public Key
                          </Button>
                        )}
                      </div>
                      {publicKeys.length === 0 ? (
                        <div className="flex flex-col items-center pt-10 pb-20">
                          <Image
                            src="/PublicKeys.svg"
                            alt="No Keys Icon"
                            width={40}
                            height={40}
                            className="size-10 sm:size-12 text-blue-500 mx-auto mb-2"
                          />
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                            Add an external public key to encrypt files or text.
                          </p>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleAddPublicKey}
                          >
                            Add External Public Key
                          </Button>
                        </div>
                      ) : (
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
                              {publicKeys.map((key: PublicKey, index: number) => (
                                <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 text-gray-500 font-normal">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {sliceAddress(key.publicKey)}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopy(key.publicKey)}
                                      >
                                        <Copy className="size-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="truncate max-w-30 sm:max-w-40">
                                        {key.note || '---'}
                                      </span>
                                      <Popover open={isNotePopoverOpen && editKey?.index === index} onOpenChange={(open) => {
                                        if (!open) {
                                          setIsNotePopoverOpen(false)
                                          setEditKey(null)
                                        }
                                      }}>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditNote(key, index)}
                                          >
                                            <Pencil className="size-4" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[90vw] sm:w-80">
                                          <div className="space-y-4">
                                            <Label htmlFor="editNote" className="text-sm font-medium text-gray-900 dark:text-gray-100">Edit Note</Label>
                                            <Input
                                              id="editNote"
                                              type="text"
                                              value={editKey?.note || ''}
                                              onChange={handleNoteChange}
                                              className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
                                              placeholder="Optional note for this public key"
                                            />
                                            <div className="flex justify-end gap-2">
                                              <Button
                                                variant="outline"
                                                onClick={() => {
                                                  setIsNotePopoverOpen(false)
                                                  setEditKey(null)
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={handleSaveNote}
                                              >
                                                Save
                                              </Button>
                                            </div>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Popover open={isDeletePopoverOpen && deleteIndex === index} onOpenChange={(open) => {
                                      if (!open) {
                                        setIsDeletePopoverOpen(false)
                                        setDeleteIndex(null)
                                      }
                                    }}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setIsDeletePopoverOpen(true)
                                            setDeleteIndex(index)
                                          }}
                                        >
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
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setIsDeletePopoverOpen(false)
                                                setDeleteIndex(null)
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              onClick={() => handleDeleteKey(index)}
                                            >
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
                      )}
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{activeTab}</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Content for {activeTab} section will be implemented here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
