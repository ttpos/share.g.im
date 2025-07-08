/* eslint-disable import/order */
'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  cn
} from '@ttpos/share-ui'
import { Settings, Lock, X, ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { ExternalPublicKeysTab } from '@/components/Header/ExternalPublicKeysTab'
import { ImportDialog } from '@/components/Header/ImportDialog'
import { GeneralTab } from '@/components/Header/GeneralTab'
import { KeysTab } from '@/components/Header/KeysTab'
import { PublicKeyForm } from '@/components/Header/PublicKeyForm'
// import { SecurityPasswordTab } from '@/components/Header/SecurityPasswordTab'
import { TABS, STORAGE_KEYS } from '@/constants'
import { useSecureLocalStorage } from '@/hooks'
import { validatePublicKey } from '@/lib/key'
import { PublicKey, KeyPair, TabType } from '@/types'

export default function Header() {
  // Main state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('General')
  const [showMobileNav, setShowMobileNav] = useState(false)

  // Import related state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Public key management state
  const [publicKeys, setPublicKeys, removePublicKeys] = useSecureLocalStorage<PublicKey[]>(STORAGE_KEYS.PUBLIC_KEYS, [])
  const [showAddKey, setShowAddKey] = useState(false)
  const [editKey, setEditKey] = useState<PublicKey | null>(null)
  const [validationError, setValidationError] = useState('')

  // Key pair management state
  const [keyPairs, setKeyPairs, removeKeyPairs] = useSecureLocalStorage<KeyPair[]>(STORAGE_KEYS.KEY_PAIRS, [])
  const [showCreateKeyPair, setShowCreateKeyPair] = useState(false)
  const [editKeyPair, setEditKeyPair] = useState<KeyPair | null>(null)

  // Password management state
  const [storedPasswordHash, setStoredPasswordHash, removePasswordHash] = useSecureLocalStorage<string | null>(STORAGE_KEYS.PASSWORD_HASH, null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  // Reset all states function
  const resetAllStates = useCallback(() => {
    setShowImportDialog(false)
    setSelectedFile(null)
    setShowAddKey(false)
    setEditKey(null)
    setShowChangePassword(false)
    setShowCreateKeyPair(false)
    setEditKeyPair(null)
    setValidationError('')
  }, [])

  // Tab click handler
  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab)
    setShowMobileNav(false)
    resetAllStates()
    if (tab === 'Security Password' && !storedPasswordHash) {
      setShowChangePassword(true)
    }
  }, [storedPasswordHash, resetAllStates])

  // Dialog close handler
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    resetAllStates()
  }, [resetAllStates])

  // File handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
  }, [])

  const handleImport = useCallback(() => {
    setShowImportDialog(false)
    setSelectedFile(null)
    // Add import logic here
  }, [])

  // Handle saving a public key
  const handleSavePublicKey = useCallback(() => {
    if (!editKey) {
      setValidationError('No public key data provided')
      toast.error('No public key data provided')
      return
    }

    // Validate public key
    const validation = validatePublicKey(editKey.publicKey)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid public key')
      toast.error(validation.error || 'Invalid public key')
      return
    }

    const newPublicKeys = [...publicKeys]
    if (editKey.index !== undefined) {
      // Update existing key
      newPublicKeys[editKey.index] = {
        publicKey: editKey.publicKey,
        note: editKey.note || ''
      }
    } else {
      // Add new key
      newPublicKeys.push({
        publicKey: editKey.publicKey,
        note: editKey.note || ''
      })
    }

    setPublicKeys(newPublicKeys)
    toast.success('Public key saved successfully')
    setShowAddKey(false)
    setEditKey(null)
    setValidationError('')
  }, [editKey, publicKeys, setPublicKeys, setShowAddKey, setEditKey])

  // Render tab content
  const renderTabContent = () => {
    if (showImportDialog) {
      return (
        <ImportDialog
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onImport={handleImport}
          onCancel={() => setShowImportDialog(false)}
          setPublicKeys={setPublicKeys}
          setKeyPairs={setKeyPairs}
          setStoredPasswordHash={setStoredPasswordHash}
        />
      )
    }

    if (showAddKey) {
      return (
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setShowAddKey(false)}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Receiver Keys</h2>
          </div>
          <div className="flex justify-center text-center pt-2 pb-6">
            <PublicKeyForm
              editKey={editKey}
              validationError={validationError}
              onPublicKeyChange={(value) => setEditKey(prev => ({ ...prev || { publicKey: '', note: '' }, publicKey: value }))}
              onNoteChange={(value) => setEditKey(prev => ({ ...prev || { publicKey: '', note: '' }, note: value }))}
              onSave={handleSavePublicKey}
              onCancel={() => {
                setShowAddKey(false)
                setEditKey(null)
                setValidationError('')
              }}
            />
          </div>
        </div>
      )
    }

    const tabProps = {
      publicKeys,
      setPublicKeys,
      removePublicKeys,
      keyPairs,
      setKeyPairs,
      removeKeyPairs,
      storedPasswordHash,
      setStoredPasswordHash,
      removePasswordHash,
      showCreateKeyPair,
      setShowCreateKeyPair,
      editKeyPair,
      setEditKeyPair,
      showChangePassword,
      setShowChangePassword,
      setShowImportDialog,
      setShowAddKey,
      setEditKey,
      setActiveTab
    }

    switch (activeTab) {
      case 'General':
        return <GeneralTab {...tabProps} />
      case 'Owner Keys':
        return <KeysTab {...tabProps} />
      case 'Receiver Keys':
        return <ExternalPublicKeysTab {...tabProps} />
      // case 'Security Password':
      //   return <SecurityPasswordTab {...tabProps} />
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
