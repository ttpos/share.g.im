/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { Button, Label, CustomOtpInput, Alert, AlertTitle, Popover, PopoverTrigger, PopoverContent, Input } from '@ttpos/share-ui'
import { hashPasswordFn, verifyPasswordFn } from '@ttpos/share-utils'
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
        setCurrentPasswordError(isValid ? '' : 'Current password is incorrect')
        if (!isValid) toast.error('Current password is incorrect')
      } catch (error) {
        console.error('Password verification failed:', error)
        setCurrentPasswordError('Failed to verify current password')
        toast.error('Failed to verify current password')
      }
    }

    validatePassword()
  }, [currentPassword, storedPasswordHash])

  // Handle set or change password
  const handleSetOrChangePassword = useCallback(async () => {
    const passwordValidation = validatePasswords(newPassword, confirmPassword)
    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.error!)
      toast.error(passwordValidation.error!)
      return
    }

    if (isPasswordSet && currentPasswordError) {
      toast.error('Please enter a valid current password')
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
      toast.success(isPasswordSet ? 'Password updated successfully' : 'Password set successfully')
    } catch (error) {
      console.error('Failed to save password:', error)
      setValidationError('Failed to save password. Please try again.')
      toast.error('Failed to save password. Please try again.')
    }
  }, [newPassword, confirmPassword, isPasswordSet, currentPasswordError, setStoredPasswordHash, setShowChangePassword])

  return (
    <div className="p-4 sm:p-6">
      {showChangePassword || !isPasswordSet ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security Password</h2>
            {isPasswordSet && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 cursor-pointer">
                    Forgot password
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] sm:w-80">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Forgot your password? Just
                    <span className="px-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 cursor-pointer" onClick={() => setActiveTab('General')}>
                      reset your account
                    </span>
                    to start over. Don't forget to back up your data first.
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
                    You haven't set a security password yet. To protect your account, please set one now.
                  </AlertTitle>
                </Alert>
              )}

              <div className="w-full sm:w-3/4 space-y-4">
                {isPasswordSet && (
                  <div className="space-y-2">
                    <Label htmlFor="current-password-otp-input-0" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Current Password
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
                    {isPasswordSet ? 'New Password' : 'Set your Password'}
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
                    {isPasswordSet ? 'Confirm New Password' : 'Confirm Password'}
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
                    {validationError || 'The two passwords are inconsistent, please re-enter'}
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
                    Save {!isPasswordSet && 'Password'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Security Password</h2>
          <div className="flex flex-col items-start space-y-4 sm:space-y-6 pb-4 sm:pb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Your Security Password</h3>
            <Input type="password" readOnly value="******" />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowChangePassword(true)}>
              Change
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
