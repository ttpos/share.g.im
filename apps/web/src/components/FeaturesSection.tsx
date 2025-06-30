import { cn } from '@ttpos/share-ui'
import { Info, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function FeaturesSection() {
  const [showFeatures, setShowFeatures] = useState(false)

  return (
    <div className="rounded-md p-4 border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowFeatures(!showFeatures)}
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5" />
          <span className="text-base sm:text-lg font-semibold">Features</span>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 transform transition-transform duration-300',
            showFeatures ? 'rotate-180' : ''
          )}
        />
      </div>
      <ul
        className={cn(
          'space-y-4 text-sm sm:text-base transition-all duration-500 ease-in-out overflow-hidden',
          showFeatures ? 'max-h-96 opacity-100 pt-4' : 'max-h-0 opacity-0'
        )}
      >
        <li className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
          <span className="opacity-60">Supports encryption/decryption of files and text.</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
          <span className="opacity-60">Uses ECIES with secp256k1 curve for asymmetric encryption.</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
          <span className="opacity-60">Processes large files in chunks for better efficiency.</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
          <span className="opacity-60">Optional auto-download for encrypted/decrypted results.</span>
        </li>
      </ul>
    </div>
  )
}
