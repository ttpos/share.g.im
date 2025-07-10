import {
  isBase58String,
  validateBase58PublicKey
} from '@nsiod/share-utils'

import { ValidationResult } from '../types'

export const validatePublicKey = (publicKey: string): ValidationResult => {
  if (!publicKey) {
    return { isValid: false, error: 'Please enter a public key' }
  }

  if (!isBase58String(publicKey)) {
    return { isValid: false, error: 'Invalid public key format. Must be a Base58 string.' }
  }

  const validation = validateBase58PublicKey(publicKey)
  if (!validation.isValid) {
    return { isValid: false, error: validation.error || 'Public key validation failed. Please check your input.' }
  }

  return { isValid: true }
}

export const validatePasswords = (newPassword: string, confirmPassword: string): ValidationResult => {
  if (!newPassword) {
    return { isValid: false, error: 'Please enter a new password' }
  }
  if (!confirmPassword) {
    return { isValid: false, error: 'Please enter the confirm password' }
  }
  if (newPassword !== confirmPassword) {
    return { isValid: false, error: 'The two passwords are inconsistent, please re-enter' }
  }
  return { isValid: true }
}
