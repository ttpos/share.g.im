/* eslint-disable no-unused-vars */
import { Button } from '@ttpos/share-ui'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { CreateKeyPairForm } from '@/components/Header/CreateKeyPairForm'
import { KeyPairTable } from '@/components/Header/KeyPairTable'
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
  // Handle creating a new key pair
  const handleCreateKeyPair = useCallback(() => {
    setEditKeyPair({ publicKey: '', privateKey: '', note: '' })
    setShowCreateKeyPair(true)
  }, [setEditKeyPair, setShowCreateKeyPair])

  // Handle updating note
  const handleNoteChange = useCallback((value: string) => {
    setEditKeyPair((prev: KeyPair | null) =>
      prev ? { ...prev, note: value } : { publicKey: '', privateKey: '', note: value }
    )
  }, [setEditKeyPair])

  // Handle updating public key
  const handlePublicKeyChange = useCallback((value: string) => {
    setEditKeyPair((prev: KeyPair | null) =>
      prev ? { ...prev, publicKey: value } : { publicKey: value, privateKey: '', note: '' }
    )
  }, [setEditKeyPair])

  // Handle updating private key
  const handlePrivateKeyChange = useCallback((value: string) => {
    setEditKeyPair((prev: KeyPair | null) =>
      prev ? { ...prev, privateKey: value } : { publicKey: '', privateKey: value, note: '' }
    )
  }, [setEditKeyPair])

  // Handle saving a key pair
  const handleSaveKeyPair = useCallback(() => {
    if (!editKeyPair) return

    const newKeyPairs = [...keyPairs]
    if (editKeyPair.index !== undefined) {
      newKeyPairs[editKeyPair.index] = {
        publicKey: editKeyPair.publicKey,
        privateKey: editKeyPair.privateKey,
        note: editKeyPair.note || ''
      }
    } else {
      newKeyPairs.push({
        publicKey: editKeyPair.publicKey,
        privateKey: editKeyPair.privateKey,
        note: editKeyPair.note || ''
      })
    }

    setKeyPairs(newKeyPairs)
    toast.success('Key pair saved successfully')
    setShowCreateKeyPair(false)
    setEditKeyPair(null)
  }, [editKeyPair, keyPairs, setKeyPairs, setShowCreateKeyPair, setEditKeyPair])

  // Handle deleting a key pair
  const handleDeleteKeyPair = useCallback((index: number) => {
    const newKeyPairs = keyPairs.filter((_, i) => i !== index)
    setKeyPairs(newKeyPairs)
    toast.success('Key pair deleted successfully')
  }, [keyPairs, setKeyPairs])

  // Handle copying a key
  const handleCopyKey = useCallback((key: string, type: 'public' | 'private') => {
    if (key) {
      navigator.clipboard.writeText(key)
      toast.success(`${type === 'public' ? 'Public' : 'Private'} key copied to clipboard`)
    } else {
      toast.error('Key is empty, cannot copy')
    }
  }, [])

  // Handle editing a note for a key pair
  const handleEditKeyPairNote = useCallback((keyPair: KeyPair, index: number) => {
    setEditKeyPair({ ...keyPair, index })
  }, [setEditKeyPair])

  // Handle saving a note in the table
  const handleSaveKeyPairNoteInTable = useCallback((index: number, note: string) => {
    const newKeyPairs = [...keyPairs]
    newKeyPairs[index] = {
      publicKey: newKeyPairs[index]?.publicKey || '',
      privateKey: newKeyPairs[index]?.privateKey || '',
      note
    }
    setKeyPairs(newKeyPairs)
    toast.success('Note updated successfully')
  }, [keyPairs, setKeyPairs])

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {showCreateKeyPair ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setShowCreateKeyPair(false)}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Keys</h2>
          </div>
          <div className="flex justify-center text-center pt-2 pb-6">
            <CreateKeyPairForm
              keyPair={editKeyPair}
              onNoteChange={handleNoteChange}
              onPublicKeyChange={handlePublicKeyChange}
              onPrivateKeyChange={handlePrivateKeyChange}
              onSave={handleSaveKeyPair}
              onCancel={() => setShowCreateKeyPair(false)}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Keys</h2>
            {keyPairs.length > 0 && (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateKeyPair}>
                Create Key
              </Button>
            )}
          </div>

          {keyPairs.length === 0 ? (
            <div className="flex flex-col items-center pt-10 pb-20">
              <Image src="/PublicKeys.svg" alt="No Keys Icon" width={40} height={40} className="size-10 sm:size-12 text-blue-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Create a Key to Encrypt Files or Text
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateKeyPair}>
                Create Key
              </Button>
            </div>
          ) : (
            <KeyPairTable
              keyPairs={keyPairs}
              onCopyPublic={(key) => handleCopyKey(key, 'public')}
              onCopyPrivate={(key) => handleCopyKey(key, 'private')}
              onEditNote={handleEditKeyPairNote}
              onDelete={handleDeleteKeyPair}
              onSaveNote={handleSaveKeyPairNoteInTable}
            />
          )}
        </>
      )}
    </div>
  )
}
