/* eslint-disable no-unused-vars */

import { Button, cn } from '@nsiod/share-ui'
import { formatFileSize } from '@nsiod/share-utils'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React from 'react'

import { FileInfo } from '@/types'

interface FileUploadAreaProps {
  fileInfo: FileInfo | null
  isDragOver: boolean
  onFileSelect: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClear: () => void
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  fileInfo,
  isDragOver,
  onFileSelect,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onClear
}) => {
  const tUpload = useTranslations('upload')

  if (fileInfo) {
    return (
      <div className="p-4 rounded-lg border-1 border-dashed border-blue-300 dark:border-blue-500 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-md bg-gray-100 dark:bg-gray-700">
          <div className="flex items-center flex-1 space-x-3 w-full">
            <Image
              src="/FolderFilled.svg"
              alt={tUpload('selectedFile')}
              width={36}
              height={36}
              className="w-9 h-9 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-300"
            />
            <div className="flex flex-col flex-1 gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-[300px]">
                {fileInfo.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(fileInfo.size)}
              </span>
            </div>
          </div>
          <Button
            size={'sm'}
            variant="secondary"
            className="mt-2 sm:mt-0 size-8 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/50"
            onClick={onClear}
          >
            <X />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-4 sm:p-6 border-1 border-dashed rounded-md cursor-pointer transition-all py-8 sm:py-12',
        isDragOver
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
      )}
      onClick={onFileSelect}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Image
        src="/Files.svg"
        alt={tUpload('dragDrop')}
        width={36}
        height={36}
        className="w-9 h-9 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-300 mb-2 sm:mb-3"
      />
      <p className={cn(
        'text-xs sm:text-sm font-medium text-center',
        isDragOver
          ? 'text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-200'
      )}>
        {isDragOver ? tUpload('dropHere') : tUpload('dragDrop')}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{tUpload('or')}</p>
      <Button
        size={'sm'}
        variant="outline"
        className="mt-2 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer"
      >
        {tUpload('selectFile')}
      </Button>
    </div>
  )
}
