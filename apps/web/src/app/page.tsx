'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const key = '@nsiod/share-web-locale'
    const savedLocale = localStorage.getItem(key)
    if (savedLocale && ['en', 'zh'].includes(savedLocale)) {
      router.replace(`/${savedLocale}`)
      return
    }

    const browserLanguages = navigator.languages || [navigator.language]
    let detectedLocale = 'en'

    for (const lang of browserLanguages) {
      const normalizedLang = lang.toLowerCase().split('-')[0]
      if (normalizedLang === 'zh') {
        detectedLocale = 'zh'
        break
      }
    }
    localStorage.setItem(key, detectedLocale)

    router.replace(`/${detectedLocale}`)
  }, [router])

  return (
    <html lang="en">
      <body>
      </body>
    </html>
  )
}
