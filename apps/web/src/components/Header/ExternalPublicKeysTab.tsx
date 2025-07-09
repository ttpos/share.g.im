/* eslint-disable import/order */
/* eslint-disable no-unused-vars */

import { Button } from '@ttpos/share-ui'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { EmptyState } from '@/components/Header/EmptyState'
import { usePublicKeyManagement } from '@/hooks'
import { PublicKey } from '@/types'

import { PublicKeyTable } from '@/components/Header/PublicKeyTable'

interface ExternalPublicKeysTabProps {
  publicKeys: PublicKey[]
  setPublicKeys: (keys: PublicKey[]) => void
  setShowAddKey: (show: boolean) => void
  setEditKey: (key: PublicKey | null) => void
}

export const ExternalPublicKeysTab = ({
  publicKeys,
  setPublicKeys,
  setShowAddKey,
  setEditKey
}: ExternalPublicKeysTabProps) => {
  const tSettings = useTranslations('settings.receiverKeys')
  const tButtons = useTranslations('buttons')

  const {
    handleDeleteKey,
    handleCopy,
    handleSaveNoteInTable
  } = usePublicKeyManagement({ publicKeys, setPublicKeys })

  const handleAddPublicKey = useCallback(() => {
    setEditKey({ publicKey: '', note: '' })
    setShowAddKey(true)
  }, [setEditKey, setShowAddKey])

  const handleEditNote = useCallback((key: PublicKey, index: number) => {
    setEditKey({ ...key, index })
    setShowAddKey(true)
  }, [setEditKey, setShowAddKey])

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {tSettings('title')}
        </h2>
        {publicKeys.length > 0 && (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddPublicKey}>
            <Plus className="size-4 sm:hidden" />
            <span className="hidden sm:inline">{tButtons('addReceiverKeys')}</span>
          </Button>
        )}
      </div>

      {publicKeys.length === 0 ? (
        <EmptyState
          icon="/PublicKeys.svg"
          title={tSettings('noKeys')}
          description={tSettings('description')}
          buttonText={tButtons('addReceiverKeys')}
          onButtonClick={handleAddPublicKey}
        />
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
}
