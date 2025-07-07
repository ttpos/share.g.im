'use client'

import {
  Label,
  RadioGroup,
  RadioGroupItem
} from '@ttpos/share-ui'
import { useTheme } from 'next-themes'

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</h3>
      <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {['system', 'light', 'dark'].map((themeOption) => (
          <div key={themeOption} className="flex items-center space-x-2">
            <RadioGroupItem
              value={themeOption}
              id={themeOption}
              className="border-gray-300 dark:border-gray-600 h-4 w-4 sm:h-5 sm:w-5"
            />
            <Label htmlFor={themeOption} className="text-xs sm:text-sm capitalize">
              {themeOption}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
