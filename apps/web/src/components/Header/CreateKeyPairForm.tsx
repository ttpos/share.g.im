/* eslint-disable no-unused-vars */
import { Button, Label, Input, cn } from '@nsiod/share-ui'
import { deriveKeyPair, downloadFile, generateMnemonic, validateMnemonic } from '@nsiod/share-utils'
import { RefreshCw, Shuffle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { validatePublicKey } from '@/lib/key'
import { KeyPair } from '@/types'

interface CreateKeyPairFormProps {
  keyPair: KeyPair | null
  onNoteChange: (value: string) => void
  onPublicKeyChange: (value: string) => void
  onMnemonicChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export const CreateKeyPairForm = ({
  keyPair,
  onNoteChange,
  onPublicKeyChange,
  onMnemonicChange,
  onSave,
  onCancel
}: CreateKeyPairFormProps) => {
  const tSettings = useTranslations('settings.ownerKeys')
  const tButtons = useTranslations('buttons')
  const tMessages = useTranslations('messages')
  const tInput = useTranslations('input')
  const tProcessing = useTranslations('processing')

  const [mnemonic, setMnemonic] = useState(keyPair?.mnemonic || '')
  const [publicKey, setPublicKey] = useState(keyPair?.publicKey || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [mnemonicError, setMnemonicError] = useState('')
  const [isMnemonicValid, setIsMnemonicValid] = useState(false)

  // Generate key pair from mnemonic
  const generateKeyPairFromMnemonic = useCallback(async (mnemonicPhrase: string) => {
    if (!mnemonicPhrase.trim()) {
      return
    }

    setIsGenerating(true)
    setMnemonicError('')

    try {
      const { publicKey: newPublicKey } = deriveKeyPair(mnemonicPhrase.trim())
      setPublicKey(newPublicKey)

      // Sync to parent component
      onPublicKeyChange(newPublicKey)
      onMnemonicChange(mnemonicPhrase.trim())

      toast.success(tMessages('success.keyPairGenerated'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : tMessages('error.failedGenerateKeyPair')
      setMnemonicError(errorMessage)
      toast.error(errorMessage)
      console.error('Generate key pair error:', error)
      setPublicKey('')
      onPublicKeyChange('')
    } finally {
      setIsGenerating(false)
    }
  }, [onPublicKeyChange, onMnemonicChange, tMessages])

  // Generate new mnemonic
  const handleGenerateNewMnemonic = useCallback(() => {
    try {
      const newMnemonic = generateMnemonic(128) // 12 words
      setMnemonic(newMnemonic)
      setMnemonicError('')
      toast.success(tMessages('success.mnemonicGenerated'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : tMessages('error.failedGenerateMnemonic')
      setMnemonicError(errorMessage)
      toast.error(errorMessage)
      console.error('Generate mnemonic error:', error)
    }
  }, [tMessages])

  // Handle mnemonic input change
  const handleMnemonicChange = useCallback((value: string) => {
    setMnemonic(value)
    setMnemonicError('')

    // Reset public key when mnemonic changes
    if (publicKey && value.trim() !== keyPair?.mnemonic) {
      setPublicKey('')
      onPublicKeyChange('')
    }
  }, [publicKey, keyPair?.mnemonic, onPublicKeyChange])

  // Auto-generate key pair when mnemonic is valid
  useEffect(() => {
    // Validate mnemonic phrase
    const validateMnemonicPhrase = (mnemonicPhrase: string) => {
      if (!mnemonicPhrase.trim()) {
        setIsMnemonicValid(false)
        return false
      }

      try {
        const validation = validateMnemonic(mnemonicPhrase.trim())
        setIsMnemonicValid(validation.isValid)
        return validation.isValid
      } catch (error) {
        console.error('Mnemonic validation error:', error)
        setIsMnemonicValid(false)
        return false
      }
    }

    if (mnemonic && validateMnemonicPhrase(mnemonic) && !publicKey) {
      generateKeyPairFromMnemonic(mnemonic)
    }
  }, [mnemonic, generateKeyPairFromMnemonic, publicKey])

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, type: string) => {
    if (text && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(tMessages(`success.${type}Copied`))
      }).catch(() => {
        toast.error(tMessages(`error.failedCopy${type}`))
      })
    }
  }, [tMessages])

  // Download mnemonic
  const downloadMnemonic = useCallback(() => {
    if (mnemonic) {
      const blob = new Blob([mnemonic], { type: 'text/plain' })
      const fileName = 'mnemonic.txt'
      downloadFile(blob, fileName)

      toast.success(tMessages('success.mnemonicDownloaded'))
    }
  }, [mnemonic, tMessages])

  // Save key pair
  const handleSave = useCallback(() => {
    if (!publicKey || !mnemonic) {
      toast.error(tMessages('error.keyPairIncomplete'))
      return
    }

    if (!isMnemonicValid) {
      toast.error(tMessages('error.noMnemonic'))
      return
    }

    // Validate public key
    const validation = validatePublicKey(publicKey)
    if (!validation.isValid) {
      toast.error(validation.error || tMessages('error.invalidPublicKey'))
      return
    }

    onSave()
  }, [publicKey, mnemonic, isMnemonicValid, onSave, tMessages])

  return (
    <div className="w-full pb-4 sm:pb-6">
      <div className="w-full sm:w-3/4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="mnemonicInput" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {tSettings('mnemonicPhrase')}
            </Label>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleGenerateNewMnemonic}
            >
              <Shuffle className="size-4" />
              {tButtons('generateNew')}
            </Button>
          </div>

          <div className="relative">
            <div className='flex items-center justify-between gap-2 mb-2'>
              <div className='relative flex-1'>
                <Input
                  id="mnemonicInput"
                  type="text"
                  value={mnemonic}
                  onChange={(e) => handleMnemonicChange(e.target.value)}
                  className={cn(
                    // Base styles
                    'w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200',
                    // Conditional border colors
                    {
                      // Error state (invalid mnemonic)
                      'border-red-400 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400':
                        mnemonic && !isMnemonicValid,
                      // Success state (valid mnemonic)
                      'border-green-400 dark:border-green-500 focus:border-green-500 dark:focus:border-green-400':
                        mnemonic && isMnemonicValid,
                      // Default state (empty or no validation yet)
                      'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400':
                        !mnemonic || (!isMnemonicValid && !mnemonic)
                    }
                  )}
                  placeholder={tSettings('generateNewMnemonic')}
                />
              </div>
            </div>
          </div>

          {mnemonicError && (
            <p className="text-left text-xs sm:text-sm text-red-600 dark:text-red-400">
              {mnemonicError}
            </p>
          )}

          {mnemonic && !isMnemonicValid && (
            <p className="text-left text-xs text-red-600 dark:text-red-400">
              {tSettings('invalidMnemonic')}
            </p>
          )}

          {mnemonic && isMnemonicValid && (
            <p className="text-left text-xs text-green-600 dark:text-green-400">
              {tSettings('validMnemonic')}
            </p>
          )}

          {!mnemonic && (
            <p className="text-left text-xs text-gray-500 dark:text-gray-400">
              {tSettings('mnemonicNote')}
            </p>
          )}
        </div>

        {publicKey && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="generatedPublicKey" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {tSettings('publicKey')}
              </Label>
              {isGenerating && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <RefreshCw className="size-3 mr-1 animate-spin" />
                  {tProcessing('generating')}
                </div>
              )}
            </div>
            <div className="relative">
              <Input
                id="generatedPublicKey"
                type="text"
                value={publicKey}
                readOnly
                className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 cursor-default"
                placeholder={tSettings('publicKeyPlaceholder')}
              />
            </div>
          </div>
        )}

        {mnemonic && isMnemonicValid && (
          <div className="space-y-2">
            <p className="text-left text-xs text-amber-600 dark:text-amber-400">
              {tSettings('keepSafe')}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="keyPairNote" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {tInput('note')}
          </Label>
          <Input
            id="keyPairNote"
            type="text"
            value={keyPair?.note || ''}
            onChange={(e) => onNoteChange(e.target.value)}
            className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
            placeholder={tInput('addNote')}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            {tButtons('cancel')}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSave}
            disabled={!isMnemonicValid || !publicKey || !mnemonic}
          >
            {tButtons('saveKeyPair')}
          </Button>
        </div>
      </div>
    </div>
  )
}
