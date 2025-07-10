/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  CustomOtpInput
} from '@nsiod/share-ui'
import { hashPasswordFn, downloadFile } from '@nsiod/share-utils'
import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

import pageJson from '@/../package.json'
import { LanguageSelector } from '@/components/LanguageSelector'
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

interface BackupData {
  version: string
  timestamp: string
  publicKeys: PublicKey[]
  keyPairs: KeyPair[]
  passwordHash: string | null
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
  const t = useTranslations('settings.general')
  const tButtons = useTranslations('buttons')
  const tMessages = useTranslations('messages')

  const [isResetPopoverOpen, setIsResetPopoverOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportPassword, setExportPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  // Initialize crypto worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/cryptoWorker.ts', import.meta.url))
    return () => workerRef.current?.terminate()
  }, [])

  // Handle account reset
  const handleReset = useCallback(() => {
    removePublicKeys()
    removeKeyPairs()
    removePasswordHash()
    setIsResetPopoverOpen(false)
    toast.success(tMessages('success.accountReset'))
  }, [removePublicKeys, removeKeyPairs, removePasswordHash, tMessages])

  // Create backup data
  const createBackupData = useCallback((): BackupData => {
    return {
      version: pageJson.version,
      timestamp: new Date().toISOString(),
      publicKeys,
      keyPairs,
      passwordHash: storedPasswordHash
    }
  }, [publicKeys, keyPairs, storedPasswordHash])

  // Handle backup export using cryptoWorker
  const handleExport = useCallback(async () => {
    if (!exportPassword || exportPassword.length !== 6) {
      toast.error(tMessages('error.enterExportPassword'))
      return
    }

    setIsProcessing(true)
    try {
      // Create backup data
      const backupData = createBackupData()
      const jsonData = JSON.stringify(backupData, null, 2)

      // Hash the export password
      const hashedPassword = await hashPasswordFn(exportPassword)

      // Use cryptoWorker to encrypt the backup data
      const worker = workerRef.current
      if (!worker) throw new Error('Web Worker not initialized')

      const encryptedResult = await new Promise<{
        data: Blob
        base64?: string
        filename: string
      }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          const { data, error } = e.data
          if (error) {
            reject(new Error(error))
          } else if (data) {
            resolve(data)
          }
        }

        worker.postMessage({
          mode: 'encrypt',
          encryptionMode: 'pwd',
          text: jsonData,
          password: exportPassword,
          isTextMode: true
        })
      })

      // Create the final export object with password hash
      const exportObject = {
        data: encryptedResult.base64, // Use encrypted base64 string from cryptoWorker
        passwordHash: hashedPassword,
        version: pageJson.version
      }

      const blob = new Blob([JSON.stringify(exportObject)], { type: 'application/json' })
      const fileName = `vault_backup_${new Date().toISOString().split('T')[0]}.enc`
      downloadFile(blob, fileName)

      setIsExportDialogOpen(false)
      setExportPassword('')
      toast.success(tMessages('success.backupCreated'))
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(tMessages('error.failedCreateBackup'))
    } finally {
      setIsProcessing(false)
    }
  }, [exportPassword, createBackupData, tMessages])

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('title')}</h2>

        <ThemeSelector />
        <LanguageSelector />

        {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('backupData.title')}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('backupData.description')}
            </p>
          </div>
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsExportDialogOpen(true)}
          >
            {tButtons('export')}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('importData.title')}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('importData.description')}
            </p>
          </div>
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowImportDialog(true)}
          >
            {tButtons('import')}
          </Button>
        </div> */}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-2 sm:gap-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('resetAccount.title')}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('resetAccount.description')}
            </p>
          </div>
          <Popover open={isResetPopoverOpen} onOpenChange={setIsResetPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                {tButtons('reset')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] sm:w-80">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <Info className="size-3 sm:size-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('resetAccount.confirmTitle')}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t('resetAccount.confirmDescription')}
                </p>
                <div className="flex justify-end gap-2 sm:gap-3">
                  <Button variant="outline" onClick={() => setIsResetPopoverOpen(false)}>
                    {tButtons('cancel')}
                  </Button>
                  <Button variant="destructive" onClick={handleReset}>
                    {tButtons('reset')}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[430px]">
          <DialogHeader>
            <DialogTitle>{t('export.title')}</DialogTitle>
            <DialogDescription>
              {t('export.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-password">{t('export.password')}</Label>
              <CustomOtpInput
                length={6}
                value={exportPassword}
                onChange={setExportPassword}
                id="export-password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              {tMessages('buttons.cancel')}
            </Button>
            <Button
              onClick={handleExport}
              disabled={exportPassword.length !== 6 || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? tMessages('processing.exporting') : tMessages('buttons.export')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
