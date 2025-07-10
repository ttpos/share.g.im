/* eslint-disable no-unused-vars */

import { Label, Input, PasswordInput } from '@nsiod/share-ui'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React from 'react'

import { PublicKey, KeyPair } from '@/types'

import { KeyInputDropdown } from './KeyInputDropdown'

interface KeyInputSectionProps {
  processMode: 'encrypt' | 'decrypt'
  keyInput: string
  matchedKeys: (PublicKey | KeyPair)[]
  showKeyDropdown: boolean
  onKeyInputChange: (value: string) => void
  onKeyInputFocus: () => void
  onKeyInputBlur: () => void
  onKeySelect: (key: PublicKey | KeyPair) => void
  keyInputRef: React.RefObject<HTMLInputElement>
  getMatchedPublicKey: () => string | null
}

export const KeyInputSection: React.FC<KeyInputSectionProps> = ({
  processMode,
  keyInput,
  matchedKeys,
  showKeyDropdown,
  onKeyInputChange,
  onKeyInputFocus,
  onKeyInputBlur,
  onKeySelect,
  keyInputRef,
  getMatchedPublicKey
}) => {
  const tInput = useTranslations('input')

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        <Label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
          {processMode === 'encrypt' ? tInput('publicKey') : tInput('privateKey')}
        </Label>
        <div className="relative">
          {processMode === 'encrypt' ? (
            <Input
              ref={keyInputRef}
              value={keyInput}
              onChange={(e) => onKeyInputChange(e.target.value)}
              onFocus={onKeyInputFocus}
              onBlur={onKeyInputBlur}
              placeholder={tInput('enterPublicKey')}
              className="font-mono text-xs sm:text-sm h-10 flex-1 rounded-lg border-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-200"
            />
          ) : (
            <PasswordInput
              ref={keyInputRef}
              value={keyInput}
              onChange={(e) => onKeyInputChange(e.target.value)}
              onFocus={onKeyInputFocus}
              onBlur={onKeyInputBlur}
              placeholder={tInput('enterPrivateKey')}
              className="font-mono text-xs sm:text-sm h-10 flex-1 rounded-lg border-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-200"
            />
          )}
          {matchedKeys.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          )}

          <KeyInputDropdown
            showDropdown={showKeyDropdown}
            matchedKeys={matchedKeys}
            processMode={processMode}
            keyInput={keyInput}
            onKeySelect={onKeySelect}
          />
        </div>
      </div>

      {processMode === 'decrypt' && getMatchedPublicKey() && (
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
            {tInput('publicKey')}
          </Label>
          <PasswordInput
            value={getMatchedPublicKey() || ''}
            readOnly
            defaultShowPassword={true}
            className="font-mono text-xs sm:text-sm h-10 flex-1 rounded-lg border-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 cursor-default"
            placeholder={tInput('publicKey')}
          />
        </div>
      )}
    </div>
  )
}
