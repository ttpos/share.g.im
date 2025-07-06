/* eslint-disable no-unused-vars */
import { Button, Label, Input } from '@ttpos/share-ui'
import { deriveKeyPair, downloadFile } from '@ttpos/share-utils'
import { Copy, Download, RefreshCw } from 'lucide-react'
import { useState, useCallback } from 'react'
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
  const [hasGenerated, setHasGenerated] = useState(!!keyPair?.publicKey)
  const [mnemonicError, setMnemonicError] = useState('')

  // Generate key pair from mnemonic
  const handleGenerateFromMnemonic = useCallback(async () => {
    if (!mnemonic.trim()) {
      setMnemonicError('Please enter a mnemonic phrase')
      toast.error('Please enter a mnemonic phrase')
      return
    }

    setIsGenerating(true)
    setMnemonicError('')

    try {
      // const { publicKey: newPublicKey, privateKey: newPrivateKey } = deriveKeyPair(mnemonic.trim())
      const { publicKey: newPublicKey } = deriveKeyPair(mnemonic.trim())

      setPublicKey(newPublicKey)
      setHasGenerated(true)

      // Sync to parent component
      onPublicKeyChange(newPublicKey)
      onMnemonicChange(mnemonic.trim())

      toast.success('Key pair generated successfully from mnemonic')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate key pair'
      setMnemonicError(errorMessage)
      toast.error(errorMessage)
      console.error('Generate key pair error:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [mnemonic, onPublicKeyChange, onMnemonicChange])

  // Handle mnemonic input change
  const handleMnemonicChange = useCallback((value: string) => {
    setMnemonic(value)
    setMnemonicError('')
    // Reset generated state when mnemonic changes
    if (hasGenerated && value.trim() !== keyPair?.mnemonic) {
      setHasGenerated(false)
      setPublicKey('')
    }
  }, [hasGenerated, keyPair?.mnemonic])

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
    if (!hasGenerated) {
      toast.error('Please generate key pair from mnemonic first')
      return
    }

    if (!publicKey || !mnemonic) {
      toast.error('Key pair is incomplete')
      return
    }

    // Validate public key
    const validation = validatePublicKey(publicKey)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid public key')
      return
    }

    onSave()
  }, [hasGenerated, publicKey, mnemonic, onSave])

  return (
    <div className="w-full pb-4 sm:pb-6">
      <div className="w-full sm:w-3/4 space-y-4">
        {!hasGenerated && (
          <div className="space-y-2">
            <Label htmlFor="mnemonicInput" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Mnemonic Phrase
            </Label>
            <div className="relative">
              <div className='flex items-center justify-between gap-2 mb-2'>
                <div className='relative flex-1'>
                  <Input
                    id="mnemonicInput"
                    type="text"
                    value={mnemonic}
                    onChange={(e) => handleMnemonicChange(e.target.value)}
                    className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 pr-20"
                    placeholder="Enter your mnemonic phrase"
                    disabled={hasGenerated}
                  />
                  {mnemonic && !hasGenerated && (
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
                <Button
                  onClick={handleGenerateFromMnemonic}
                  disabled={isGenerating || !mnemonic.trim()}
                  loading={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Generate
                </Button>
              </div>
              
            </div>
            {mnemonicError && (
              <p className="text-left text-xs sm:text-sm text-red-600 dark:text-red-400">
                {mnemonicError}
              </p>
            )}
            {!hasGenerated && (
              <p className="text-left text-xs text-gray-500 dark:text-gray-400">
                Enter a valid BIP39 mnemonic phrase to generate your key pair
              </p>
            )}
          </div>
        )}

        {hasGenerated && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="generatedMnemonic" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Mnemonic Phrase
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHasGenerated(false)
                  setPublicKey('')
                  setMnemonicError('')
                }}
                className="text-xs"
              >
                <RefreshCw className="size-3 mr-1" />
                Edit Mnemonic
              </Button>
            </div>
            <div className="relative">
              <Input
                id="generatedMnemonic"
                type="text"
                value={mnemonic}
                readOnly
                className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 pr-20 cursor-default"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
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
            </div>
            <p className="text-left text-xs text-amber-600 dark:text-amber-400">
              Please keep your mnemonic phrase safe. It can be used to recover your private key.
            </p>
          </div>
        )}

        {hasGenerated && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="generatedPublicKey" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Public Key
              </Label>
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
            disabled={!hasGenerated || !publicKey || !mnemonic}
          >
            Save Key Pair
          </Button>
        </div>
      </div>
    </div>
  )
}
