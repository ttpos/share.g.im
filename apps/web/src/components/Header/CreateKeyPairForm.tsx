/* eslint-disable no-unused-vars */
import { Button, Label, Input, cn } from '@ttpos/share-ui'
import { deriveKeyPair, downloadFile, generateMnemonic, validateMnemonic } from '@ttpos/share-utils'
import { Copy, Download, RefreshCw, Shuffle } from 'lucide-react'
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

      toast.success('Key pair generated successfully from mnemonic')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate key pair'
      setMnemonicError(errorMessage)
      toast.error(errorMessage)
      console.error('Generate key pair error:', error)
      setPublicKey('')
      onPublicKeyChange('')
    } finally {
      setIsGenerating(false)
    }
  }, [onPublicKeyChange, onMnemonicChange])

  // Generate new mnemonic
  const handleGenerateNewMnemonic = useCallback(() => {
    try {
      const newMnemonic = generateMnemonic(128) // 12 words
      setMnemonic(newMnemonic)
      setMnemonicError('')
      toast.success('New mnemonic generated')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate mnemonic'
      setMnemonicError(errorMessage)
      toast.error(errorMessage)
      console.error('Generate mnemonic error:', error)
    }
  }, [])

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
        toast.success(`${type} copied to clipboard`)
      }).catch(() => {
        toast.error(`Failed to copy ${type}`)
      })
    }
  }, [])

  // Download mnemonic
  const downloadMnemonic = useCallback(() => {
    if (mnemonic) {
      const blob = new Blob([mnemonic], { type: 'text/plain' })
      const fileName = 'mnemonic.txt'
      downloadFile(blob, fileName)

      toast.success('Mnemonic downloaded')
    }
  }, [mnemonic])

  // Save key pair
  const handleSave = useCallback(() => {
    if (!publicKey || !mnemonic) {
      toast.error('Key pair is incomplete')
      return
    }

    if (!isMnemonicValid) {
      toast.error('Please enter a valid mnemonic phrase')
      return
    }

    // Validate public key
    const validation = validatePublicKey(publicKey)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid public key')
      return
    }

    onSave()
  }, [publicKey, mnemonic, isMnemonicValid, onSave])

  return (
    <div className="w-full pb-4 sm:pb-6">
      <div className="w-full sm:w-3/4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="mnemonicInput" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Mnemonic Phrase
            </Label>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleGenerateNewMnemonic}
            >
              <Shuffle className="size-4" />
              Generate New
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
                    'w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 pr-20',
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
                  placeholder="Enter your mnemonic phrase or click 'Generate New'"
                />
                {mnemonic && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(mnemonic, 'Mnemonic')}
                      disabled={!mnemonic}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={downloadMnemonic}
                      disabled={!mnemonic}
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                )}
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
              Invalid mnemonic phrase. Please check your input.
            </p>
          )}

          {mnemonic && isMnemonicValid && (
            <p className="text-left text-xs text-green-600 dark:text-green-400">
              ✓ Valid mnemonic phrase
            </p>
          )}

          {!mnemonic && (
            <p className="text-left text-xs text-gray-500 dark:text-gray-400">
              Enter a valid BIP39 mnemonic phrase or generate a new one
            </p>
          )}
        </div>

        {publicKey && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="generatedPublicKey" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Public Key
              </Label>
              {isGenerating && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <RefreshCw className="size-3 mr-1 animate-spin" />
                  Generating...
                </div>
              )}
            </div>
            <div className="relative">
              <Input
                id="generatedPublicKey"
                type="text"
                value={publicKey}
                readOnly
                className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 pr-10 cursor-default"
                placeholder="Public key will be displayed here"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => copyToClipboard(publicKey, 'Public key')}
                disabled={!publicKey}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {mnemonic && isMnemonicValid && (
          <div className="space-y-2">
            <p className="text-left text-xs text-amber-600 dark:text-amber-400">
              Please keep your mnemonic phrase safe. It can be used to recover your private key.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="keyPairNote" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Note
          </Label>
          <Input
            id="keyPairNote"
            type="text"
            value={keyPair?.note || ''}
            onChange={(e) => onNoteChange(e.target.value)}
            className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
            placeholder="Add an optional note for this key pair"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSave}
            disabled={!isMnemonicValid || !publicKey || !mnemonic}
          >
            Save Key Pair
          </Button>
        </div>
      </div>
    </div>
  )
}
