'use client'

import { FolderOpen, FileText } from 'lucide-react'
import { useRef } from 'react'

import FeaturesSection from '@/components/FeaturesSection'
import { PasswordEncryption } from '@/components/PasswordEncryption'
import { PublicKeyEncryption } from '@/components/PublicKeyEncryption'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppState, ENCRYPTION_MODES } from '@/contexts/AppStateContext'

export default function HomePage() {
  const {
    appState,
    selectedFile,
    textContent,
    selectedEncryptionMode,
    handleFileSelect,
    handlePasteText
  } = useAppState()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      {appState === 'encrypt' ? (
        <div className="container mx-auto p-4">
          {selectedEncryptionMode === ENCRYPTION_MODES.KEY_ENCRYPTION && (selectedFile || textContent !== null) && (
            <PublicKeyEncryption />
          )}
          {selectedEncryptionMode === ENCRYPTION_MODES.PASSWORD_ENCRYPTION && (selectedFile || textContent !== null) && (
            <PasswordEncryption />
          )}
          {(!selectedFile && textContent === null) && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              请先选择文件或输入文本
            </div>
          )}
        </div>
      ) : (
        <Card className="p-0! border-none bg-transparent backdrop-blur-lg shadow-none">
          <CardContent className="p-0!">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="border-2 border-dashed border-border rounded-md bg-card py-18 px-8 mb-6">
              <div className="relative grid grid-cols-2">
                <div className="flex flex-col items-end space-y-4 pr-8">
                  <FolderOpen className="w-10 h-10 ml-2 mr-4.5 text-blue-500" />
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={triggerFileInput}>
                    选择文件
                  </Button>
                </div>

                <div className="absolute left-1/2 top-1/2 w-px h-6 bg-border transform -translate-x-1/2 -translate-y-1/2"></div>

                <div className="flex flex-col items-start space-y-4 pl-8">
                  <FileText className="w-10 h-10 ml-4.5 text-blue-500" />
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={handlePasteText}>
                    粘贴文本
                  </Button>
                </div>
              </div>
            </div>
            <FeaturesSection />
          </CardContent>
        </Card>
      )}
    </>
  )
}
