import type { FileInfo } from '@/types'

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const generateTimestamp = () => +new Date()

export function getFilenameWithoutExtension(filename: string) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.slice(0, -1).join('.') : filename
}

export const generateDownloadFilename = (
  inputType: 'file' | 'message',
  fileInfo: FileInfo | null,
  processMode: 'encrypt' | 'decrypt' | null
) => {
  const timestamp = generateTimestamp()

  if (inputType === 'file' && fileInfo) {
    const nameWithoutExt = getFilenameWithoutExtension(fileInfo.name)
    const extension = fileInfo.originalExtension || 'bin'
    return processMode === 'encrypt'
      ? `${nameWithoutExt}_${timestamp}.enc`
      : `${timestamp}.${extension}`
  } else if (inputType === 'message') {
    return processMode === 'encrypt'
      ? `encrypted_text_${timestamp}.enc`
      : `text_${timestamp}.txt`
  }

  return `text_${timestamp}`
}
