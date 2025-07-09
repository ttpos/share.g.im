/* eslint-disable no-unused-vars */

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttpos/share-ui'
import { Info, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ConfirmationPopoverProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  triggerIcon?: React.ReactNode
  type?: 'delete' | 'reset' | 'general'
}

export const ConfirmationPopover = ({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  triggerIcon = <Trash2 className="size-4 sm:size-5" />,
  type = 'delete'
}: ConfirmationPopoverProps) => {
  const t = useTranslations()

  const getButtonVariant = () => {
    switch (type) {
      case 'delete':
        return 'destructive'
      case 'reset':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getButtonText = () => {
    switch (type) {
      case 'delete':
        return t('buttons.delete')
      case 'reset':
        return t('buttons.reset')
      default:
        return t('buttons.confirm')
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'delete':
      case 'reset':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'delete':
      case 'reset':
        return 'bg-red-100 dark:bg-red-900/20'
      default:
        return 'bg-blue-100 dark:bg-blue-900/20'
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          {triggerIcon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] sm:w-80">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${getBackgroundColor()} flex items-center justify-center`}>
              <Info className={`size-3 sm:size-4 ${getIconColor()}`} />
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
          <div className="flex justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={onCancel}>
              {t('buttons.cancel')}
            </Button>
            <Button variant={getButtonVariant()} onClick={onConfirm}>
              {getButtonText()}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
