// export const TABS = ['General', 'Owner Keys', 'Receiver Keys', 'Security Password'] as const
export const TABS = ['General', 'Owner Keys', 'Receiver Keys'] as const
export const STORAGE_KEYS = {
  PUBLIC_KEYS: 'externalPublicKeys',
  PASSWORD_HASH: 'passwordHash',
  KEY_PAIRS: 'keyPairs'
} as const
