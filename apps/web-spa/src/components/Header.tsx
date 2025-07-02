import { Lock } from 'lucide-react'

import { ThemeToggle } from '@/components/ThemeToggle'

export default function Header() {
  return (
    <header className="relative w-full py-8 z-10 bg-[#0052D9] dark:bg-gray-900 text-white dark:text-gray-200 overflow-hidden">
      <Lock className="hidden md:block absolute size-34 top-1/3 -left-12 text-[#4c85e4] dark:text-blue-400" />
      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center md:justify-between gap-4 p-4">
        <div className="flex-1 text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center text-white dark:text-gray-200">
            Secure Vault
          </h1>
          <h3 className="text-sm md:text-base font-medium text-white dark:text-gray-300">
            ECIES File & Message Encryption Tool
          </h3>
        </div>

        <div className="flex items-center gap-2 justify-center md:justify-end w-full md:w-auto md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
