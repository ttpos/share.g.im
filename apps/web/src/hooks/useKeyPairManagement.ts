/* eslint-disable no-unused-vars */
import { useCallback } from 'react'
import { toast } from 'sonner'

import { KeyPair } from '@/types'

interface UseKeyPairManagementProps {
  keyPairs: KeyPair[]
  setKeyPairs: (keys: KeyPair[]) => void
  setEditKeyPair: (keyPair: KeyPair | null | ((prev: KeyPair | null) => KeyPair | null)) => void
  setShowCreateKeyPair: (show: boolean) => void
}

export const useKeyPairManagement = ({
  keyPairs,
  setKeyPairs,
  setEditKeyPair,
  setShowCreateKeyPair
}: UseKeyPairManagementProps) => {
  const handleCreateKeyPair = useCallback(() => {
    setEditKeyPair({ publicKey: '', privateKey: '', note: '' })
    setShowCreateKeyPair(true)
  }, [setEditKeyPair, setShowCreateKeyPair])

  const handleSaveKeyPair = useCallback((keyPair: KeyPair) => {
    const newKeyPairs = [...keyPairs]
    if (keyPair.index !== undefined) {
      newKeyPairs[keyPair.index] = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        note: keyPair.note || ''
      }
    } else {
      newKeyPairs.push({
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        note: keyPair.note || ''
      })
    }

    setKeyPairs(newKeyPairs)
    toast.success('Key pair saved successfully')
    setShowCreateKeyPair(false)
    setEditKeyPair(null)
  }, [keyPairs, setKeyPairs, setShowCreateKeyPair, setEditKeyPair])

  const handleDeleteKeyPair = useCallback((index: number) => {
    const newKeyPairs = keyPairs.filter((_, i) => i !== index)
    setKeyPairs(newKeyPairs)
    toast.success('Key pair deleted successfully')
  }, [keyPairs, setKeyPairs])

  const handleCopyKey = useCallback((key: string, type: 'public' | 'private') => {
    if (key) {
      navigator.clipboard.writeText(key)
      toast.success(`${type === 'public' ? 'Public' : 'Private'} key copied to clipboard`)
    } else {
      toast.error('Key is empty, cannot copy')
    }
  }, [])

  const handleSaveNoteInTable = useCallback((index: number, note: string) => {
    const newKeyPairs = [...keyPairs]
    newKeyPairs[index] = {
      publicKey: newKeyPairs[index]?.publicKey || '',
      privateKey: newKeyPairs[index]?.privateKey || '',
      note
    }
    setKeyPairs(newKeyPairs)
    toast.success('Note updated successfully')
  }, [keyPairs, setKeyPairs])

  return {
    handleCreateKeyPair,
    handleSaveKeyPair,
    handleDeleteKeyPair,
    handleCopyKey,
    handleSaveNoteInTable
  }
}
