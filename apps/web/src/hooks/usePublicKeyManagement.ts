/* eslint-disable no-unused-vars */

import { useCallback } from 'react'
import { toast } from 'sonner'

import { validatePublicKey } from '@/lib/key'
import { PublicKey } from '@/types'

interface UsePublicKeyManagementProps {
  publicKeys: PublicKey[]
  setPublicKeys: (keys: PublicKey[]) => void
}

export const usePublicKeyManagement = ({
  publicKeys,
  setPublicKeys
}: UsePublicKeyManagementProps) => {
  const handleSavePublicKey = useCallback((editKey: PublicKey) => {
    const validation = validatePublicKey(editKey.publicKey)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid public key')
    }

    const newPublicKeys = [...publicKeys]
    if (editKey.index !== undefined) {
      newPublicKeys[editKey.index] = {
        publicKey: editKey.publicKey,
        note: editKey.note || ''
      }
    } else {
      newPublicKeys.push({
        publicKey: editKey.publicKey,
        note: editKey.note || ''
      })
    }

    setPublicKeys(newPublicKeys)
    toast.success('Public key saved successfully')
  }, [publicKeys, setPublicKeys])

  const handleDeleteKey = useCallback((index: number) => {
    const newPublicKeys = publicKeys.filter((_, i) => i !== index)
    setPublicKeys(newPublicKeys)
    toast.success('Public key deleted successfully')
  }, [publicKeys, setPublicKeys])

  const handleCopy = useCallback((address: string) => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Public key copied to clipboard')
    } else {
      toast.error('Public key is empty, cannot copy')
    }
  }, [])

  const handleSaveNoteInTable = useCallback((index: number, note: string) => {
    const newPublicKeys = [...publicKeys]
    newPublicKeys[index] = {
      publicKey: newPublicKeys[index]?.publicKey || '',
      note
    }
    setPublicKeys(newPublicKeys)
    toast.success('Note updated successfully')
  }, [publicKeys, setPublicKeys])

  return {
    handleSavePublicKey,
    handleDeleteKey,
    handleCopy,
    handleSaveNoteInTable
  }
}
