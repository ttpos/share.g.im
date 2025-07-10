/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { Eye, ChevronDown, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React from 'react'

import { PublicKey, KeyPair } from '@/types'

interface KeyInputDropdownProps {
  showDropdown: boolean
  matchedKeys: (PublicKey | KeyPair)[]
  processMode: 'encrypt' | 'decrypt'
  keyInput: string
  onKeySelect: (key: PublicKey | KeyPair) => void
}

export const KeyInputDropdown: React.FC<KeyInputDropdownProps> = ({
  showDropdown,
  matchedKeys,
  processMode,
  keyInput,
  onKeySelect
}) => {
  const tInput = useTranslations('input')

  const getKeySecondaryText = (key: PublicKey | KeyPair) => {
    if (processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic) {
      return key.publicKey
    }
    return key.note || ''
  }

  if (!showDropdown || matchedKeys.length === 0) {
    return null
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
      <div className="p-2">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
          <Eye className="w-4 h-4" />
          <span>{processMode === 'encrypt' ? tInput('publicKey') : tInput('privateKey')}</span>
        </div>
        {matchedKeys.map((key, index) => {
          const secondaryText = getKeySecondaryText(key)
          const isSelected = processMode === 'encrypt'
            ? keyInput === key.publicKey
            : ('mnemonic' in key && key.mnemonic)
              ? keyInput === key.mnemonic
              : keyInput === key.publicKey

          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md"
              onClick={() => onKeySelect(key)}
            >
              <div className="flex-1 min-w-0">
                {!(processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic) && (
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono truncate">
                    {key.publicKey}
                  </div>
                )}
                {secondaryText && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    - {processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic
                      ? secondaryText
                      : secondaryText}
                  </div>
                )}
                {key.note && processMode === 'decrypt' && 'mnemonic' in key && key.mnemonic && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                    - {key.note}
                  </div>
                )}
              </div>
              {isSelected && (
                <Check className="w-4 h-4 text-blue-500 ml-2 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
