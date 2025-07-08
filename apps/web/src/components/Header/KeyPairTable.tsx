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
import { Copy, Pencil, Trash2, Info, Link, Download, Eye } from 'lucide-react'
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
  const [isMnemonicPopoverOpen, setIsMnemonicPopoverOpen] = useState(false)
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

  const handleViewMnemonic = (index: number) => {
    setEditingIndex(index)
    setIsMnemonicPopoverOpen(true)
  }

  const handleCloseMnemonic = () => {
    setIsMnemonicPopoverOpen(false)
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
    <div className="w-full">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 sm:p-3 text-left" style={{ width: '55%' }}>Public Key</TableHead>
            <TableHead className="p-2 sm:p-3 text-left" style={{ width: '20%' }}>Note</TableHead>
            <TableHead className="p-2 sm:p-3 text-left" style={{ width: '25%' }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keyPairs.map((keyPair, index) => (
            <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 text-gray-500 font-normal">
              <TableCell className="p-2 sm:p-3" style={{ width: '55%' }}>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center min-w-0">
                      <span className="truncate flex-1 font-mono text-xs sm:text-sm">
                        {keyPair.publicKey}
                      </span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className='w-full'>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs break-all flex-1">
                        {keyPair.publicKey}
                      </span>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              <TableCell className="p-2 sm:p-3" style={{ width: '20%' }}>
                <div className="flex items-center min-w-0">
                  <span className="truncate" title={keyPair.note}>
                    {keyPair.note || '---'}
                  </span>
                  <Popover open={isNotePopoverOpen && editingIndex === index} onOpenChange={(open) => !open && handleCancelNote()}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => handleEditNote(keyPair, index)}>
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
              <TableCell className="p-2 sm:p-3" style={{ width: '25%' }}>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => onCopyPublic(keyPair.publicKey)}>
                    <Copy className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleLink(keyPair.publicKey)}>
                    <Link className="size-4" />
                  </Button>
                  <Popover open={isMnemonicPopoverOpen && editingIndex === index} onOpenChange={(open) => !open && handleCloseMnemonic()}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleViewMnemonic(index)} disabled={!keyPair.mnemonic}>
                        <Eye className="size-4 sm:size-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[85vw] max-w-[380px] p-0">
                      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Eye className="size-3 sm:size-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h4 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">View Mnemonic</h4>
                        </div>

                        {keyPair.mnemonic && (
                          <div className="space-y-3">
                            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-md border border-blue-200 dark:border-blue-800">
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                {keyPair.mnemonic.split(' ').map((word, wordIndex) => (
                                  <div key={wordIndex} className="flex items-center gap-1 p-1 sm:p-1.5 bg-white dark:bg-gray-800 rounded text-xs">
                                    <span className="text-gray-400 font-mono w-4 text-right text-xs">{wordIndex + 1}</span>
                                    <span className="font-mono text-gray-900 dark:text-gray-100 text-xs truncate">{word}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-start gap-1.5 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-md border border-amber-200 dark:border-amber-800">
                              <Info className="size-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                Keep safe and never share
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
                                onClick={() => onCopyMnemonic(keyPair.mnemonic!)}
                              >
                                <Copy className="size-3" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                                onClick={() => handleDownloadMnemonic(keyPair.mnemonic!, index)}
                              >
                                <Download className="size-3" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Delete Button */}
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
