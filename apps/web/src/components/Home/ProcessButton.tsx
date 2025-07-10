import { Button, cn } from '@nsiod/share-ui'
import { useTranslations } from 'next-intl'
import React from 'react'

interface ProcessButtonProps {
  processMode: 'encrypt' | 'decrypt'
  isDisabled: boolean
  isProcessing: boolean
  progress: number
  onClick: () => void
}

export const ProcessButton: React.FC<ProcessButtonProps> = ({
  processMode,
  isDisabled,
  isProcessing,
  progress,
  onClick
}) => {
  const tButtons = useTranslations('buttons')

  return (
    <Button
      variant="default"
      size="lg"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'w-full text-white rounded-md relative overflow-hidden cursor-pointer h-10 text-sm sm:text-base',
        processMode === 'encrypt'
          ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
          : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 h-full transition-all duration-300',
          processMode === 'encrypt' ? 'bg-blue-400 dark:bg-blue-600' : 'bg-green-400 dark:bg-green-600'
        )}
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10">
        {tButtons(processMode === 'encrypt' ? 'encrypt' : 'decrypt')}
        {isProcessing && ` ${progress}%`}
      </span>
    </Button>
  )
}
