'use client'

import GradientText from '@/components/reactbits/GradientText'
import ShinyText from '@/components/reactbits/ShinyText'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Header() {
  return (
    <header className="w-full max-w-6xl mb-8 md:mb-12 z-0">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
        <div className="flex-1 text-center">
          <GradientText className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-2 sm:gap-3">
            SecureVault
          </GradientText>
          <ShinyText
            text="ECIES File & Message Encryption Tool"
            disabled={false}
            speed={3}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 justify-center md:justify-end w-full md:w-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
