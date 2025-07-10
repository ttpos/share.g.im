/* eslint-disable no-unused-vars */
import { Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@nsiod/share-ui'
import { useTranslations } from 'next-intl'
import React from 'react'

import TextInputArea from '@/components/TextInputArea'
import { FileInfo } from '@/types'

import { FileUploadArea } from './FileUploadArea'

interface CryptoTabsProps {
  inputType: 'file' | 'message'
  fileInfo: FileInfo | null
  textInput: string
  textResult: string | null
  isDragOver: boolean
  onInputTypeChange: (value: 'file' | 'message') => void
  onTextInputChange: (value: string) => void
  onFileSelect: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClearFile: () => void
}

export const CryptoTabs: React.FC<CryptoTabsProps> = ({
  inputType,
  fileInfo,
  textInput,
  textResult,
  isDragOver,
  onInputTypeChange,
  onTextInputChange,
  onFileSelect,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onClearFile
}) => {
  const tNavigation = useTranslations('navigation')
  const tInput = useTranslations('input')

  return (
    <Tabs
      value={inputType}
      className="flex flex-col items-center w-full"
      onValueChange={(value) => onInputTypeChange(value as 'file' | 'message')}
    >
      <TabsList className="flex h-auto bg-white dark:bg-[#282B30] p-1 rounded-t-lg justify-center">
        <TabsTrigger
          value="file"
          className="flex-1 sm:flex-none px-4 sm:px-8 py-2 text-xs sm:text-sm font-medium text-[#00000099] dark:text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-700 dark:data-[state=active]:bg-blue-600 transition-colors rounded-md cursor-pointer"
        >
          {tNavigation('upload')}
        </TabsTrigger>
        <TabsTrigger
          value="message"
          className="flex-1 sm:flex-none px-4 sm:px-8 py-2 text-xs sm:text-sm font-medium text-[#00000099] dark:text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-700 dark:data-[state=active]:bg-blue-600 transition-colors rounded-md cursor-pointer"
        >
          {tNavigation('pasteText')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file" className="w-full max-w-[90vw] mt-0">
        <div className="py-4 sm:py-6 space-y-6">
          <div className="bg-white dark:bg-[#282B30] rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-6">
            <FileUploadArea
              fileInfo={fileInfo}
              isDragOver={isDragOver}
              onFileSelect={onFileSelect}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClear={onClearFile}
            />
            {textResult && (
              <div className="mt-4">
                <Textarea
                  value={textResult}
                  readOnly
                  placeholder={tInput('pasteText')}
                  className="h-[186px] sm:min-h-[238px] max-h-[238px] sm:max-h-[300px] font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 pr-3 sm:pr-4 pb-10 sm:pb-14"
                />
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="message" className="w-full max-w-[90vw] mt-0">
        <div className="py-4 sm:py-6 space-y-6">
          <TextInputArea
            textInput={textInput}
            textResult={textResult}
            onTextChange={onTextInputChange}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
