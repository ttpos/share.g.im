/* eslint-disable import/order */
/* eslint-disable no-unused-vars */
import { Button } from '@ttpos/share-ui'
import Image from 'next/image'
import { useCallback } from 'react'
import { toast } from 'sonner'
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
  // Handle adding a new public key
  const handleAddPublicKey = useCallback(() => {
    setEditKey({ publicKey: '', note: '' })
    setShowAddKey(true)
  }, [setEditKey, setShowAddKey])

  // Handle copying a public key
  const handleCopy = useCallback((address: string) => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Public key copied to clipboard')
    } else {
      toast.error('Public key is empty, cannot copy')
    }
  }, [])

  // Handle editing a note for a public key
  const handleEditNote = useCallback((key: PublicKey, index: number) => {
    setEditKey({ ...key, index })
    setShowAddKey(true)
  }, [setEditKey, setShowAddKey])

  // Handle saving a note in the table
  const handleSaveNoteInTable = useCallback((index: number, note: string) => {
    const newPublicKeys = [...publicKeys]
    newPublicKeys[index] = {
      publicKey: newPublicKeys[index]?.publicKey || '',
      note
    }
    setPublicKeys(newPublicKeys)
    toast.success('Note updated successfully')
  }, [publicKeys, setPublicKeys])

  // Handle deleting a public key
  const handleDeleteKey = useCallback((index: number) => {
    const newPublicKeys = publicKeys.filter((_, i) => i !== index)
    setPublicKeys(newPublicKeys)
    toast.success('Public key deleted successfully')
  }, [publicKeys, setPublicKeys])

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">External Public Keys</h2>
        {publicKeys.length > 0 && (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddPublicKey}>
            Add External Public Key
          </Button>
        )}
      </div>

      {publicKeys.length === 0 ? (
        <div className="flex flex-col items-center pt-10 pb-20">
          <Image src="/PublicKeys.svg" alt="No Keys Icon" width={40} height={40} className="size-10 sm:size-12 text-blue-500 mx-auto mb-2" />
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            Add an external public key to encrypt files or text.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddPublicKey}>
            Add External Public Key
          </Button>
        </div>
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
