'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from './button'
import { Input } from './input'

interface PasswordInputProps extends React.ComponentProps<"input"> {
  defaultShowPassword?: boolean
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ defaultShowPassword = false, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(defaultShowPassword)

  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        ref={ref}
        className={`pr-10 ${props.className || ''}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
      </Button>
    </div>
  )
})

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
