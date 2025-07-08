'use client'

import {
  Label,
  RadioGroup,
  RadioGroupItem
} from '@ttpos/share-ui'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('settings.general')

  const themes = [
    { value: 'system', label: t('themes.system') },
    { value: 'light', label: t('themes.light') },
    { value: 'dark', label: t('themes.dark') }
  ]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('theme')}</h3>
      <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {themes.map((themeOption) => (
          <div key={themeOption.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={themeOption.value}
              id={themeOption.value}
              className="border-gray-300 dark:border-gray-600 h-4 w-4 sm:h-5 sm:w-5"
            />
            <Label htmlFor={themeOption.value} className="text-xs sm:text-sm">
              {themeOption.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
