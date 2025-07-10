import { Textarea } from '@nsiod/share-ui'
import { useTranslations } from 'next-intl'

interface TextInputAreaProps {
  textInput: string
  textResult: string | null
  // eslint-disable-next-line no-unused-vars
  onTextChange: (value: string) => void
}

export default function TextInputArea({
  textInput,
  textResult,
  onTextChange
}: TextInputAreaProps) {
  const t = useTranslations('input')

  return (
    <div className="bg-white dark:bg-[#282B30] rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 p-6">
      <Textarea
        value={textInput}
        onChange={(e) => !textResult ? onTextChange(e.target.value) : undefined}
        readOnly={!!textResult}
        placeholder={t('pasteText')}
        className="h-[182px] sm:min-h-[234px] max-h-[234px] sm:max-h-[300px] font-mono text-xs sm:text-sm break-all resize-none rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-[#282B30] text-[#282B30] dark:text-gray-200 pr-3 sm:pr-4 pb-10 sm:pb-14"
      />
    </div>
  )
}
