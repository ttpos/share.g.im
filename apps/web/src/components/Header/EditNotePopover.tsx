/* eslint-disable no-unused-vars */
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Label,
  Input
} from '@ttpos/share-ui'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface EditNotePopoverProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  note: string
  onNoteChange: (note: string) => void
  onSave: () => void
  onCancel: () => void
  placeholder?: string
}

export const EditNotePopover = ({
  isOpen,
  onOpenChange,
  note,
  onNoteChange,
  onSave,
  onCancel,
  placeholder
}: EditNotePopoverProps) => {
  const tSettings = useTranslations('settings')
  const tButtons = useTranslations('buttons')
  const tInput = useTranslations('input')

  const defaultPlaceholder = placeholder || tInput('optionalNote')

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] sm:w-80">
        <div className="space-y-4">
          <Label htmlFor="editNote" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {tSettings('editNote')}
          </Label>
          <Input
            id="editNote"
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
            placeholder={defaultPlaceholder}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              {tButtons('cancel')}
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onSave}>
              {tButtons('save')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
