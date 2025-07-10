'use client'

import {
  isBase58String,
  validateBase58PublicKey
} from '@nsiod/share-utils'
import Image from 'next/image'
import { Locale, useTranslations } from 'next-intl'
import { useEffect, useCallback, use } from 'react'
import { toast } from 'sonner'

import { ActionButtons, CryptoTabs, KeyInputSection, ProcessButton } from '@/components/Home'
import HowItWorksSection from '@/components/HowItWorksSection'
import { useCryptoLogic, useCryptoState, useDragAndDrop } from '@/hooks'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default function HomePage({ params }: Props) {
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const { locale } = use(params)
  const t = useTranslations()

  const {
    state,
    updateState,
    clearState,
    freshPublicKeys,
    freshKeyPairs,
    refreshKeysFromStorage,
    workerRef,
    fileInputRef,
    keyInputRef,
    detectTimeoutRef
  } = useCryptoState()

  const {
    handleTextInputChange,
    handleKeyInputFocus,
    handleKeyInputChange,
    handleKeySelect,
    handleKeyInputBlur,
    getMatchedPublicKey,
    handleFileSelect,
    handleCopy,
    handleDownload,
    processInput
  } = useCryptoLogic({
    state,
    updateState,
    clearState,
    freshPublicKeys,
    freshKeyPairs,
    refreshKeysFromStorage,
    workerRef,
    detectTimeoutRef
  })

  const {
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({
    updateState,
    clearState,
    handleFileSelect
  })

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }, [handleFileSelect])

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '')
      if (hash.startsWith('pub/')) {
        const pubKey = hash.substring(4)
        if (pubKey && isBase58String(pubKey)) {
          const validation = validateBase58PublicKey(pubKey)
          if (validation.isValid) {
            if (state.processMode === 'encrypt') {
              updateState({ keyInput: pubKey })
            } else {
              // For decrypt mode, find matching key pair and use mnemonic/private key
              const matchingKeyPair = freshKeyPairs.find(kp => kp.publicKey === pubKey)
              if (matchingKeyPair) {
                if (matchingKeyPair.mnemonic) {
                  updateState({ keyInput: matchingKeyPair.mnemonic })
                } else {
                  // If no mnemonic, we'd need the private key (not stored in our current structure)
                  updateState({ keyInput: pubKey })
                }
              } else {
                updateState({ keyInput: '' })
                toast.info(t('messages.error.noMatchingPrivateKey'))
              }
            }
          } else {
            updateState({ keyInput: '' })
          }
        } else {
          updateState({ keyInput: '' })
        }
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [state.processMode, freshKeyPairs, t, updateState])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshKeysFromStorage()
      }
    }

    const handleFocus = () => {
      refreshKeysFromStorage()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshKeysFromStorage])

  const isProcessButtonDisabled = (
    (state.inputType === 'file' && !state.selectedFile) ||
    (state.inputType === 'message' && !state.textInput) ||
    !state.keyInput ||
    state.isProcessing
  )

  return (
    <>
      <div className="relative py-8 sm:py-12 md:py-16 z-[1] bg-[#f5f3f0] dark:bg-[#0E0F11]">
        <Image
          src="/MaskGroup.svg"
          alt="Hero Background"
          fill
          className="w-full h-full object-contain sm:object-cover -z-10 dark:hidden"
        />
        <Image
          src="/MaskGroup_Dark.svg"
          alt="Hero Background"
          fill
          className="w-full h-full object-contain sm:object-cover -z-10 hidden dark:block"
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInputChange}
          accept="*/*"
          multiple={false}
        />

        <div className="flex justify-center items-center relative z-10 w-full max-w-[100vw] sm:max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center w-full">
            <CryptoTabs
              inputType={state.inputType}
              fileInfo={state.fileInfo}
              textInput={state.textInput}
              textResult={state.textResult}
              isDragOver={state.isDragOver}
              onInputTypeChange={(value) => {
                clearState()
                updateState({ inputType: value as 'file' | 'message' })
              }}
              onTextInputChange={handleTextInputChange}
              onFileSelect={triggerFileInput}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClearFile={clearState}
            />

            {(state.selectedFile || state.textInput) && (
              <div className="flex flex-col items-center w-full max-w-[90vw] sm:max-w-2xl">
                <div className="w-full sm:w-3/4 space-y-6 sm:space-y-8">
                  {!state.encryptedData && (
                    <KeyInputSection
                      processMode={state.processMode}
                      keyInput={state.keyInput}
                      matchedKeys={state.matchedKeys}
                      showKeyDropdown={state.showKeyDropdown}
                      onKeyInputChange={handleKeyInputChange}
                      onKeyInputFocus={handleKeyInputFocus}
                      onKeyInputBlur={handleKeyInputBlur}
                      onKeySelect={handleKeySelect}
                      keyInputRef={keyInputRef as React.RefObject<HTMLInputElement>}
                      getMatchedPublicKey={getMatchedPublicKey}
                    />
                  )}

                  {!state.encryptedData && (
                    <ProcessButton
                      processMode={state.processMode}
                      isDisabled={isProcessButtonDisabled}
                      isProcessing={state.isProcessing}
                      progress={state.progress}
                      onClick={processInput}
                    />
                  )}

                  {state.encryptedData && (
                    <ActionButtons
                      inputType={state.inputType}
                      isProcessing={state.isProcessing}
                      onReset={clearState}
                      onCopy={state.inputType === 'message' ? handleCopy : undefined}
                      onDownload={handleDownload}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <HowItWorksSection />
    </>
  )
}
