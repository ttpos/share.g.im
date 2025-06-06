import { formatFileSize } from '@ttpos/share-utils'
import { FileText, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileInfo } from '@/types'

interface FileInfoDisplayProps {
  fileInfo: FileInfo
  onClear?: () => void
  showStatus?: boolean
  statusText?: string
  statusType?: 'encrypt' | 'decrypt' | null
  className?: string
}

export function FileInfoDisplay({
  fileInfo,
  onClear,
  showStatus = false,
  statusText,
  statusType = 'encrypt',
  className
}: FileInfoDisplayProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-md border-2 border-dashed border-border p-4 space-y-4', className)}>
      <div className="px-2 py-4 rounded-md flex justify-between items-center bg-stone-100">
        <div className="flex items-center truncate space-x-3">
          <FileText className="w-12 h-12 text-blue-500" />
          <div className="flex flex-col truncate space-y-2">
            <p className="text-sm text-gray-500">
              Name: {fileInfo.name}
            </p>
            <p className="text-sm text-gray-500">
              Size: {formatFileSize(fileInfo.size)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 pl-4">
          {showStatus && statusText && (
            <span
              className={cn(
                'text-sm whitespace-nowrap',
                statusType === 'encrypt'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-green-600 dark:text-green-400'
              )}
            >
              {statusText}
            </span>
          )}
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
