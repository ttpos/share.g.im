import { Button, cn } from '@nsiod/share-ui'
import { RefreshCw, Copy, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React from 'react'

interface ActionButtonsProps {
  inputType: 'file' | 'message'
  isProcessing: boolean
  onReset: () => void
  onCopy?: () => void
  onDownload: () => void
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  inputType,
  isProcessing,
  onReset,
  onCopy,
  onDownload
}) => {
  const tButtons = useTranslations('buttons')

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <Button
        variant="default"
        size="lg"
        onClick={onReset}
        className="w-full sm:flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-200 rounded-md cursor-pointer h-10 text-sm sm:text-base"
      >
        {tButtons('reset')}
        <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
      </Button>
      {inputType === 'message' && onCopy && (
        <Button
          variant="default"
          size="lg"
          onClick={onCopy}
          className="w-full sm:flex-1 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-md cursor-pointer h-10 text-sm sm:text-base"
        >
          {tButtons('copy')}
          <Copy className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
        </Button>
      )}
      <Button
        variant="default"
        size="lg"
        disabled={isProcessing}
        onClick={onDownload}
        className={cn(
          'w-full text-white rounded-md cursor-pointer h-10 text-sm sm:text-base',
          inputType === 'message' ? 'sm:flex-1' : 'sm:flex-2',
          'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'
        )}
      >
        {tButtons('download')}
        <Download className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
      </Button>
    </div>
  )
}
