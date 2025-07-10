/* eslint-disable no-unused-vars */

import { Button } from '@nsiod/share-ui'
import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { CreateKeyPairForm } from '@/components/Header/CreateKeyPairForm'
import { EmptyState } from '@/components/Header/EmptyState'
import { KeyPairTable } from '@/components/Header/KeyPairTable'
import { useKeyPairManagement } from '@/hooks'
import { KeyPair } from '@/types'

interface KeysTabProps {
  keyPairs: KeyPair[]
  setKeyPairs: (keys: KeyPair[]) => void
  showCreateKeyPair: boolean
  setShowCreateKeyPair: (show: boolean) => void
  editKeyPair: KeyPair | null
  setEditKeyPair: (keyPair: KeyPair | null | ((prev: KeyPair | null) => KeyPair | null)) => void
}

export const KeysTab = ({
  keyPairs,
  setKeyPairs,
  showCreateKeyPair,
  setShowCreateKeyPair,
  editKeyPair,
  setEditKeyPair
}: KeysTabProps) => {
  const tOwnerKeys = useTranslations('settings.ownerKeys')
  const tButtons = useTranslations('buttons')

  const {
    handleCreateKeyPair,
    handleSaveKeyPair,
    handleDeleteKeyPair,
    handleCopyKey,
    handleSaveNoteInTable
  } = useKeyPairManagement({
    keyPairs,
    setKeyPairs,
    setEditKeyPair,
    setShowCreateKeyPair
  })

  // Handle updating note
  const handleNoteChange = useCallback((value: string) => {
    setEditKeyPair((prev: KeyPair | null) =>
      prev ? { ...prev, note: value } : { publicKey: '', note: value }
    )
  }, [setEditKeyPair])

  // Handle updating public key
  const handlePublicKeyChange = useCallback((value: string) => {
    setEditKeyPair((prev: KeyPair | null) =>
      prev ? { ...prev, publicKey: value } : { publicKey: value, note: '' }
    )
  }, [setEditKeyPair])

  const handleMnemonicChange = useCallback((value: string) => {
    setEditKeyPair((prev: KeyPair | null) =>
      prev ? { ...prev, mnemonic: value } : { publicKey: '', privateKey: '', mnemonic: value, note: '' }
    )
  }, [setEditKeyPair])

  // Handle saving with validation
  const handleSave = useCallback(() => {
    if (editKeyPair) {
      handleSaveKeyPair(editKeyPair)
    }
  }, [editKeyPair, handleSaveKeyPair])

  if (showCreateKeyPair) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setShowCreateKeyPair(false)}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tOwnerKeys('title')}
          </h2>
        </div>
        <div className="flex justify-center text-center pt-2 pb-6">
          <CreateKeyPairForm
            keyPair={editKeyPair}
            onNoteChange={handleNoteChange}
            onPublicKeyChange={handlePublicKeyChange}
            onMnemonicChange={handleMnemonicChange}
            onSave={handleSave}
            onCancel={() => setShowCreateKeyPair(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {tOwnerKeys('title')}
        </h2>
        {keyPairs.length > 0 && (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateKeyPair}>
            {tButtons('createKey')}
          </Button>
        )}
      </div>

      {keyPairs.length === 0 ? (
        <EmptyState
          icon="/PublicKeys.svg"
          title={tOwnerKeys('noKeys')}
          description={tOwnerKeys('description')}
          buttonText={tButtons('createKey')}
          onButtonClick={handleCreateKeyPair}
        />
      ) : (
        <KeyPairTable
          keyPairs={keyPairs}
          onCopyPublic={(key) => handleCopyKey(key, 'public')}
          onCopyMnemonic={(mnemonic) => handleCopyKey(mnemonic, 'mnemonic')}
          onEditNote={(keyPair, index) => setEditKeyPair({ ...keyPair, index })}
          onDelete={handleDeleteKeyPair}
          onSaveNote={handleSaveNoteInTable}
        />
      )}
    </div>
  )
}
