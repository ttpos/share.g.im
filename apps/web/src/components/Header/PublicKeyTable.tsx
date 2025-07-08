/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Label,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@ttpos/share-ui'
import { sliceAddress } from '@ttpos/share-utils'
import { Copy, Pencil, Trash2, Info } from 'lucide-react'
import { useState } from 'react'

import { PublicKey } from '@/types'

interface PublicKeyTableProps {
  publicKeys: PublicKey[]
  onCopy: (address: string) => void
  onEditNote: (key: PublicKey, index: number) => void
  onDelete: (index: number) => void
  onSaveNote: (index: number, note: string) => void
}

export const PublicKeyTable = ({
  publicKeys,
  onCopy,
  onEditNote,
  onDelete,
  onSaveNote
}: PublicKeyTableProps) => {
  const [isNotePopoverOpen, setIsNotePopoverOpen] = useState(false)
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingNote, setEditingNote] = useState('')

  const handleEditNote = (key: PublicKey, index: number) => {
    setEditingIndex(index)
    setEditingNote(key.note || '')
    setIsNotePopoverOpen(true)
  }

  const handleSaveNote = () => {
    if (editingIndex !== null) {
      onSaveNote(editingIndex, editingNote)
      setIsNotePopoverOpen(false)
      setEditingIndex(null)
      setEditingNote('')
    }
  }

  const handleCancelNote = () => {
    setIsNotePopoverOpen(false)
    setEditingIndex(null)
    setEditingNote('')
  }

  const handleDeleteClick = (index: number) => {
    setEditingIndex(index)
    setIsDeletePopoverOpen(true)
  }

  const handleConfirmDelete = () => {
    if (editingIndex !== null) {
      onDelete(editingIndex)
      setIsDeletePopoverOpen(false)
      setEditingIndex(null)
    }
  }

  const handleCancelDelete = () => {
    setIsDeletePopoverOpen(false)
    setEditingIndex(null)
  }

  return (
    <div className="w-full">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 sm:p-3 text-left" style={{ width: '65%' }}>Public Key</TableHead>
            <TableHead className="p-2 sm:p-3 text-left" style={{ width: '20%' }}>Note</TableHead>
            <TableHead className="p-2 sm:p-3 text-left" style={{ width: '15%' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publicKeys.map((key, index) => (
            <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 text-gray-500 font-normal">
              <TableCell className="p-2 sm:p-3" style={{ width: '65%' }}>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center min-w-0">
                      <span className="truncate flex-1 font-mono text-xs sm:text-sm">
                        {key.publicKey}
                      </span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className='w-full'>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs break-all flex-1">
                        {key.publicKey}
                      </span>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              <TableCell className="p-2 sm:p-3" style={{ width: '20%' }}>
                <div className="flex items-center min-w-0">
                  <span className="truncate" title={key.note}>{key.note || '---'}</span>
                  <Popover open={isNotePopoverOpen && editingIndex === index} onOpenChange={(open) => !open && handleCancelNote()}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => handleEditNote(key, index)}>
                        <Pencil className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[90vw] sm:w-80">
                      <div className="space-y-4">
                        <Label htmlFor="editNote" className="text-sm font-medium text-gray-900 dark:text-gray-100">Edit Note</Label>
                        <Input
                          id="editNote"
                          type="text"
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
                          placeholder="Optional note for this public key"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelNote}>
                            Cancel
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveNote}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>
              <TableCell className="p-2 sm:p-3" style={{ width: '15%' }}>
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => onCopy(key.publicKey)}>
                  <Copy className="size-4" />
                </Button>
                <Popover open={isDeletePopoverOpen && editingIndex === index} onOpenChange={(open) => !open && handleCancelDelete()}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(index)}>
                      <Trash2 className="size-4 sm:size-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[90vw] sm:w-80">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Info className="size-3 sm:size-4 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Delete Public Key</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete this public key? This action cannot be undone.
                      </p>
                      <div className="flex justify-end gap-2 sm:gap-3">
                        <Button variant="outline" size="sm" onClick={handleCancelDelete}>
                          Cancel
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleConfirmDelete}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
