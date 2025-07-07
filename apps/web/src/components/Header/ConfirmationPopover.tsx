/* eslint-disable no-unused-vars */

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttpos/share-ui'
import { Info, Trash2 } from 'lucide-react'

interface ConfirmationPopoverProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  triggerIcon?: React.ReactNode
}

export const ConfirmationPopover = ({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  triggerIcon = <Trash2 className="size-4 sm:size-5" />
}: ConfirmationPopoverProps) => (
  <Popover open={isOpen} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon">
        {triggerIcon}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[90vw] sm:w-80">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <Info className="size-3 sm:size-4 text-red-600 dark:text-red-400" />
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
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
)
