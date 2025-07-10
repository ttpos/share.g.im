import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { Locale, hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Toaster } from 'sonner'

// import './globals.css'
import '@nsiod/share-ui/css'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { Providers } from '@/components/providers'
import { routing } from '@/i18n/routing'

const inter = Inter({ subsets: ['latin'] })

interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  // Convert keywords string to array for metadata
  const keywordsString = t('keywords')
  const keywordsArray = keywordsString.split(', ')

  return {
    title: t('title'),
    description: t('description'),
    keywords: keywordsArray,
    authors: [{ name: 'nsiod' }],
    creator: 'nsiod',
    publisher: 'nsiod',
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: 'https://ns.io/',
      siteName: t('title'),
      // images: [
      //   {
      //     url: 'https://ns.io/og-image.jpg',
      //     width: 1200,
      //     height: 630,
      //     alt: t('title')
      //   }
      // ],
      locale: locale,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      creator: '@nsiod'
      // images: ['https://ns.io/twitter-image.jpg']
    },
    icons: '/logo.svg',
    alternates: {
      canonical: 'https://ns.io/'
    }
  }
}

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
              <div className="flex flex-col items-center flex-1">
                <Header />

                <div className="w-full">
                  {children}
                </div>
              </div>
            </main>
            <Footer />
            <Toaster
              richColors
              position="top-right"
              duration={3000}
            />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
