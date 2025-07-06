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
import { downloadFile, sliceAddress } from '@ttpos/share-utils'
import { Copy, Pencil, Trash2, Info, Link, Download } from 'lucide-react'
import { useState } from 'react'

import { KeyPair } from '@/types'

interface KeyPairTableProps {
  keyPairs: KeyPair[]
  onCopyPublic: (publicKey: string) => void
  onCopyMnemonic: (mnemonic: string) => void
  onEditNote: (keyPair: KeyPair, index: number) => void
  onDelete: (index: number) => void
  onSaveNote: (index: number, note: string) => void
}

export const KeyPairTable = ({
  keyPairs,
  onCopyPublic,
  onCopyMnemonic,
  onEditNote,
  onDelete,
  onSaveNote
}: KeyPairTableProps) => {
  const [isNotePopoverOpen, setIsNotePopoverOpen] = useState(false)
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingNote, setEditingNote] = useState('')

  const handleEditNote = (keyPair: KeyPair, index: number) => {
    setEditingIndex(index)
    setEditingNote(keyPair.note || '')
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

  const handleLink = (publicKey: string) => {
    const link = `${window.location.href}#/pub/${publicKey}`
    window.open(link, '_blank')
  }

  const handleDownloadMnemonic = (mnemonic: string, index: number) => {
    if (mnemonic) {
      const blob = new Blob([mnemonic], { type: 'text/plain' })
      const fileName = `mnemonic_${index + 1}.txt`
      downloadFile(blob, fileName)
    }
  }

  return (
    <div className="overflow-x-auto pb-4 sm:pb-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 sm:p-3 text-left">Public Key</TableHead>
            {/* <TableHead className="p-2 sm:p-3 text-left">Mnemonic</TableHead> */}
            <TableHead className="p-2 sm:p-3 text-left w-2/5">Note</TableHead>
            <TableHead className="p-2 sm:p-3 text-left"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keyPairs.map((keyPair, index) => (
            <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 text-gray-500 font-normal">
              <TableCell>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-2">
                      {sliceAddress(keyPair.publicKey)}
                      <div>
                        <Button variant="ghost" size="icon" onClick={() => onCopyPublic(keyPair.publicKey)}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleLink(keyPair.publicKey)}>
                          <Link className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className='w-full'>
                    <div className="flex items-center gap-2">
                      {keyPair.publicKey}
                      <div>
                        <Button variant="ghost" size="icon" onClick={() => onCopyPublic(keyPair.publicKey)}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleLink(keyPair.publicKey)}>
                          <Link className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              {/* <TableCell>
                <div className="flex items-center gap-2">
                  {keyPair.mnemonic ? sliceAddress(keyPair.mnemonic, 20) : '***'}
                  <div className="flex gap-1">
                    {keyPair.mnemonic && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => onCopyMnemonic(keyPair.mnemonic!)}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadMnemonic(keyPair.mnemonic!, index)}>
                          <Download className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </TableCell> */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-30 sm:max-w-40">
                    {keyPair.note || '---'}
                  </span>
                  <Popover open={isNotePopoverOpen && editingIndex === index} onOpenChange={(open) => !open && handleCancelNote()}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleEditNote(keyPair, index)}>
                        <Pencil className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[90vw] sm:w-80">
                      <div className="space-y-4">
                        <Label htmlFor="editKeyPairNote" className="text-sm font-medium text-gray-900 dark:text-gray-100">Edit Note</Label>
                        <Input
                          id="editKeyPairNote"
                          type="text"
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          className="w-full font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
                          placeholder="Optional note for this key pair"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={handleCancelNote}>
                            Cancel
                          </Button>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveNote}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>
              <TableCell>
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
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Delete Key Pair</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete this key pair? This action cannot be undone.
                      </p>
                      <div className="flex justify-end gap-2 sm:gap-3">
                        <Button variant="outline" onClick={handleCancelDelete}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
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
