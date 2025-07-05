/* eslint-disable no-unused-vars */

import { Button } from '@ttpos/share-ui'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'

interface ImportDialogProps {
  selectedFile: File | null
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onCancel: () => void
}

export const ImportDialog = ({
  selectedFile,
  onFileSelect,
  onImport,
  onCancel
}: ImportDialogProps) => (
  <div className="p-4 sm:p-6">
    <div className="flex items-center gap-2 mb-4">
      <Button variant="ghost" size="icon" onClick={onCancel}>
        <ChevronLeft className="size-4" />
      </Button>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Data</h2>
    </div>
    <div className="flex justify-center text-center pt-2 pb-6">
      <div className="w-full sm:w-3/4 bg-white dark:bg-gray-800 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-4 sm:p-6">
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center p-3 sm:p-6 border-1 border-dashed rounded-md cursor-pointer transition-all py-6 sm:py-8 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500">
            <Image src="/FileText.svg" alt="File Icon" width={40} height={40} className="size-10 sm:size-12 text-blue-500 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              Select the backup file you previously saved to restore your data.
            </p>
            <input type="file" id="file-input" className="hidden" accept=".enc" onChange={onFileSelect} />
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" onClick={() => document.getElementById('file-input')?.click()}>
              Select Backup File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 sm:p-6 bg-gray-100 rounded-md cursor-pointer transition-all py-6 sm:py-8 border-gray-300 dark:border-gray-600">
            <Image src="/FileTextEnc.svg" alt="File Icon" width={40} height={40} className="size-10 sm:size-12 text-blue-500 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">{selectedFile.name}</p>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 mt-2 text-sm sm:text-base" onClick={() => document.getElementById('file-input')?.click()}>
              Change File
            </Button>
          </div>
        )}
      </div>
    </div>
    <div className="flex justify-center gap-3 pb-4 sm:pb-6">
      <Button variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
        Cancel
      </Button>
      <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedFile} onClick={onImport}>
        Import
      </Button>
    </div>
  </div>
)
