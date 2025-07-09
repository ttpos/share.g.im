/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-unused-vars */
import { Button, Label, CustomOtpInput, Alert, AlertTitle, Popover, PopoverTrigger, PopoverContent, Input } from '@ttpos/share-ui'
import { hashPasswordFn, verifyPasswordFn } from '@ttpos/share-utils'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { validatePasswords } from '@/lib/key'
import { TabType } from '@/types'

interface SecurityPasswordTabProps {
  storedPasswordHash: string | null
  setStoredPasswordHash: (hash: string | null) => void
  showChangePassword: boolean
  setShowChangePassword: (value: boolean) => void
  setActiveTab: (tab: TabType) => void
}

export const SecurityPasswordTab = ({
  storedPasswordHash,
  setStoredPasswordHash,
  showChangePassword,
  setShowChangePassword,
  setActiveTab
}: SecurityPasswordTabProps) => {
  const tSecurity = useTranslations('settings.securityPassword')
  const tButtons = useTranslations('buttons')
  const tMessages = useTranslations('messages')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [validationError, setValidationError] = useState('')

  const isPasswordSet = Boolean(storedPasswordHash)

  // Password validation effect
  useEffect(() => {
    if (!storedPasswordHash || currentPassword.length !== 6) {
      setCurrentPasswordError('')
      return
    }

    const validatePassword = async () => {
      try {
        const isValid = await verifyPasswordFn(storedPasswordHash, currentPassword)
        setCurrentPasswordError(isValid ? '' : tMessages('error.currentPasswordIncorrect'))
        if (!isValid) toast.error(tMessages('error.currentPasswordIncorrect'))
      } catch (error) {
        console.error('Password verification failed:', error)
        setCurrentPasswordError(tMessages('error.failedVerifyPassword'))
        toast.error(tMessages('error.failedVerifyPassword'))
      }
    }

    validatePassword()
  }, [currentPassword, storedPasswordHash, tMessages])

  // Handle set or change password
  const handleSetOrChangePassword = useCallback(async () => {
    const passwordValidation = validatePasswords(newPassword, confirmPassword)
    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.error!)
      toast.error(passwordValidation.error!)
      return
    }

    if (isPasswordSet && currentPasswordError) {
      toast.error(tMessages('error.enterValidCurrentPassword'))
      return
    }

    try {
      const hashedPassword = await hashPasswordFn(newPassword)
      setStoredPasswordHash(hashedPassword)
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setValidationError('')
      setCurrentPasswordError('')
      toast.success(isPasswordSet ? tMessages('success.passwordUpdated') : tMessages('success.passwordSet'))
    } catch (error) {
      console.error('Failed to save password:', error)
      setValidationError(tMessages('error.failedSavePassword'))
      toast.error(tMessages('error.failedSavePassword'))
    }
  }, [newPassword, confirmPassword, isPasswordSet, currentPasswordError, setStoredPasswordHash, setShowChangePassword, tMessages])

  return (
    <div className="p-4 sm:p-6">
      {showChangePassword || !isPasswordSet ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {tSecurity('title')}
            </h2>
            {isPasswordSet && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 cursor-pointer">
                    {tSecurity('forgotPassword')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] sm:w-80">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {tSecurity('forgotPasswordHint')}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="flex justify-center text-center pt-2 pb-6">
            <div className="w-full pb-4 sm:pb-6 space-y-4">
              {!isPasswordSet && (
                <Alert className="flex bg-[#E6F0FF]">
                  <AlertTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tSecurity('notSet')}
                  </AlertTitle>
                </Alert>
              )}

              <div className="w-full sm:w-3/4 space-y-4">
                {isPasswordSet && (
                  <div className="space-y-2">
                    <Label htmlFor="current-password-otp-input-0" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tSecurity('currentPassword')}
                    </Label>
                    <CustomOtpInput
                      length={6}
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      id="current-password-otp-input"
                      disabled={!isPasswordSet}
                      error={!!currentPasswordError}
                    />
                    {currentPasswordError && (
                      <p className="text-left text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {currentPasswordError}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-password-otp-input-0" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isPasswordSet ? tSecurity('newPassword') : tSecurity('setPassword')}
                  </Label>
                  <CustomOtpInput
                    length={6}
                    value={newPassword}
                    onChange={setNewPassword}
                    id="new-password-otp-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password-otp-input-0" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isPasswordSet ? tSecurity('confirmNewPassword') : tSecurity('confirmPassword')}
                  </Label>
                  <CustomOtpInput
                    length={6}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    id="confirm-password-otp-input"
                    error={!!(newPassword && confirmPassword && newPassword !== confirmPassword)}
                  />
                </div>

                {(validationError || (newPassword && confirmPassword && newPassword !== confirmPassword)) && (
                  <p className="text-left text-xs sm:text-sm text-red-600 dark:text-red-400">
                    {validationError || tMessages('error.passwordsNotMatch')}
                  </p>
                )}

                <div className="flex">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSetOrChangePassword}
                    disabled={
                      !newPassword ||
                      !confirmPassword ||
                      (isPasswordSet && !currentPassword) ||
                      (isPasswordSet && !!currentPasswordError) ||
                      newPassword !== confirmPassword
                    }
                  >
                    {tButtons('save')} {!isPasswordSet && tSecurity('title')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {tSecurity('title')}
          </h2>
          <div className="flex flex-col items-start space-y-4 sm:space-y-6 pb-4 sm:pb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {tSecurity('yourPassword')}
            </h3>
            <Input type="password" readOnly value="******" />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowChangePassword(true)}>
              {tButtons('change')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
