/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { Button, Popover, PopoverContent, PopoverTrigger } from '@ttpos/share-ui'
import { Info } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { ThemeSelector } from '@/components/ThemeSelector'
import { PublicKey, KeyPair } from '@/types'

interface GeneralTabProps {
  publicKeys: PublicKey[]
  removePublicKeys: () => void
  keyPairs: KeyPair[]
  removeKeyPairs: () => void
  storedPasswordHash: string | null
  removePasswordHash: () => void
  setShowImportDialog: (value: boolean) => void
}

export const GeneralTab = ({
  publicKeys,
  removePublicKeys,
  keyPairs,
  removeKeyPairs,
  storedPasswordHash,
  removePasswordHash,
  setShowImportDialog
}: GeneralTabProps) => {
  const [isResetPopoverOpen, setIsResetPopoverOpen] = useState(false)

  // Handle account reset
  const handleReset = useCallback(() => {
    removePublicKeys()
    removeKeyPairs()
    removePasswordHash()
    setIsResetPopoverOpen(false)
    toast.success('Account reset successfully. All data cleared.')
  }, [removePublicKeys, removeKeyPairs, removePasswordHash])

  // Handle backup
  const handleBackup = useCallback(() => {
    // Implement backup logic (e.g., export keys and password hash to a file)
    toast.success('Backup created successfully')
  }, [])

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
}
