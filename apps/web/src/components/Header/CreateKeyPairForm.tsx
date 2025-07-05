/* eslint-disable no-unused-vars */
import { Button, Label, Input } from '@ttpos/share-ui'
import { Copy, Download } from 'lucide-react'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { validatePublicKey } from '@/lib/key'
import { KeyPair } from '@/types'

interface CreateKeyPairFormProps {
  keyPair: KeyPair | null
  onNoteChange: (value: string) => void
  onPublicKeyChange: (value: string) => void
  onPrivateKeyChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export const CreateKeyPairForm = ({
  keyPair,
  onNoteChange,
  onPublicKeyChange,
  onPrivateKeyChange,
  onSave,
  onCancel
}: CreateKeyPairFormProps) => {
  const [publicKey, setPublicKey] = useState(keyPair?.publicKey || '')
  const [privateKey, setPrivateKey] = useState(keyPair?.privateKey || '')
  const [publicKeyError, setPublicKeyError] = useState('')

  // Handle public key change with validation
  const handlePublicKeyChange = useCallback((value: string) => {
    setPublicKey(value)
    onPublicKeyChange(value) // Sync with parent
    const validation = validatePublicKey(value)
    setPublicKeyError(validation.isValid ? '' : validation.error || 'Invalid public key')
  }, [onPublicKeyChange])

  // Handle private key change
  const handlePrivateKeyChange = useCallback((value: string) => {
    setPrivateKey(value)
    onPrivateKeyChange(value) // Sync with parent
  }, [onPrivateKeyChange])

  // Handle save with validation
  const handleSaveWithValidation = useCallback(() => {
    const validation = validatePublicKey(publicKey)
    if (!validation.isValid) {
      setPublicKeyError(validation.error || 'Invalid public key')
      toast.error(validation.error || 'Invalid public key')
      return
    }

    if (!privateKey) {
      toast.error('Please enter a private key')
      return
    }

    // Update parent state with latest values
    onPublicKeyChange(publicKey)
    onPrivateKeyChange(privateKey)
    onNoteChange(keyPair?.note || '')
    onSave()
  }, [publicKey, privateKey, keyPair, onPublicKeyChange, onPrivateKeyChange, onNoteChange, onSave])

  return (
    <div className="w-full pb-4 sm:pb-6">
      <div className="w-full sm:w-3/4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="generatedPublicKey" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Public Key
          </Label>
          <div className="relative">
            <Input
              id="generatedPublicKey"
              type="text"
              value={publicKey}
              onChange={(e) => handlePublicKeyChange(e.target.value)}
              className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 pr-10"
              placeholder="Enter public key"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => publicKey && navigator.clipboard.writeText(publicKey)}
              disabled={!publicKey}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          {publicKeyError && (
            <p className="text-left text-xs sm:text-sm text-red-600 dark:text-red-400">
              {publicKeyError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="generatedPrivateKey" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Private Key
          </Label>
          <div className="relative">
            <Input
              id="generatedPrivateKey"
              type="text"
              value={privateKey}
              onChange={(e) => handlePrivateKeyChange(e.target.value)}
              className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 pr-20"
              placeholder="Enter private key"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => privateKey && navigator.clipboard.writeText(privateKey)}
                disabled={!privateKey}
              >
                <Copy className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (privateKey) {
                    const blob = new Blob([privateKey], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'private_key.txt'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }
                }}
                disabled={!privateKey}
              >
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        </div>

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
            placeholder="Optional note for this key pair"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveWithValidation}
            disabled={!!publicKeyError || !publicKey || !privateKey}
          >
            Create Key
          </Button>
        </div>
      </div>
    </div>
  )
}
