'use client'

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../lib"

interface CustomOtpInputProps {
  length?: number
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  id: string
  disabled?: boolean
  error?: boolean
}

export function CustomOtpInput({
  length = 6,
  value = "",
  onChange,
  onComplete,
  id,
  disabled = false,
  error = false,
}: CustomOtpInputProps) {
  const [internalValue, setInternalValue] = useState<string[]>(
    value.padEnd(length, "").split("").slice(0, length) || new Array(length).fill("")
  )
  const [isPasswordMode, setIsPasswordMode] = useState(true)
  const inputRefs = useRef<HTMLInputElement[]>(new Array(length).fill(null))

  // Handle input change
  const handleChange = useCallback(
    (index: number, val: string) => {
      if (val && !/^\d$/.test(val)) return

      const newValue = [...internalValue]
      newValue[index] = val.slice(0, 1)
      setInternalValue(newValue)

      const newOtpValue = newValue.join("")
      onChange?.(newOtpValue)

      if (val && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      } else if (!val && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }

      if (newValue.every(digit => digit !== "") && onComplete) {
        onComplete(newOtpValue)
      }
    },
    [internalValue, length, onChange, onComplete]
  )

  // Handle paste event
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
      if (!pastedData) return

      const newValue = [...internalValue]
      for (let i = 0; i < pastedData.length && index + i < length; i++) {
        newValue[index + i] = pastedData[i] || ""
      }
      setInternalValue(newValue)
      onChange?.(newValue.join(""))

      const nextFocusIndex = Math.min(index + pastedData.length, length - 1)
      inputRefs.current[nextFocusIndex]?.focus()

      if (newValue.every(digit => digit !== "") && onComplete) {
        onComplete(newValue.join(""))
      }
    },
    [internalValue, length, onChange, onComplete]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace" && !internalValue[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault()
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault()
        inputRefs.current[index + 1]?.focus()
      }
    },
    [internalValue, length]
  )

  // Sync external value
  useEffect(() => {
    if (value !== internalValue.join("")) {
      setInternalValue(value.padEnd(length, "").split("").slice(0, length))
    }
  }, [value, length])

  // Render input value (mask if password mode)
  const renderValue = (index: number) => {
    return isPasswordMode && internalValue[index] ? "•" : internalValue[index] || ""
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="flex gap-1 sm:gap-2">
          {Array.from({ length }).map((_, index) => (
            <Input
              key={index}
              id={`${id}-${index}`}
              ref={(el) => {
                if (el) inputRefs.current[index] = el
              }}
              type={isPasswordMode ? "password" : "text"}
              value={renderValue(index)}
              onChange={(e) => handleChange(index, e.target.value)}
              onPaste={(e) => handlePaste(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 text-center text-sm sm:text-base rounded-md focus:ring-2",
                "border border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400",
                disabled && "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50",
                error && "border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400"
              )}
              maxLength={1}
              disabled={disabled}
              aria-label={`OTP input ${index + 1}`}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPasswordMode(!isPasswordMode)}
          disabled={disabled}
          aria-label={isPasswordMode ? "Show OTP" : "Hide OTP"}
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0",
            "hover:bg-gray-100 dark:hover:bg-gray-700",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPasswordMode ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
        </Button>
      </div>
    </div>
  )
}
