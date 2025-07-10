/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { detect } from '@nsiod/share-utils'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { toast } from 'sonner'

interface UseDragAndDropProps {
  updateState: (updates: any) => void
  clearState: () => void
  handleFileSelect: (file: File) => Promise<void>
}

export const useDragAndDrop = ({ updateState, clearState, handleFileSelect }: UseDragAndDropProps) => {
  const tMessages = useTranslations('messages')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateState({ isDragOver: true })
  }, [updateState])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      updateState({ isDragOver: false })
    }
  }, [updateState])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateState({ isDragOver: false })

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      if (files.length > 1) {
        toast.error(tMessages('error.multipleFilesNotSupported'))
        return
      }

      const file = files[0]
      if (file) {
        await handleFileSelect(file)
      }
    }
  }, [updateState, handleFileSelect, tMessages])

  return {
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  }
}
