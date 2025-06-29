import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import '@/app/globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Providers } from '@/components/providers'
import { AppStateProvider } from '@/contexts/AppStateContext'

const inter = Inter({ subsets: ['latin'] })

// --- SEO Metadata ---
export const metadata: Metadata = {
  title: 'SecureVault',
  description: 'SecureVault uses ECIES for secure and efficient file encryption and decryption.',
  keywords: [
    'File encryption',
    'File decryption',
    'ECIES',
    'Asymmetric encryption',
    'Large file encryption',
    'Password protection',
    'Blockchain Security'
  ],
  authors: [{ name: 'ttpos' }],
  creator: 'ttpos',
  publisher: 'ttpos',
  openGraph: {
    title: 'SecureVault',
    description: 'SecureVault uses ECIES for secure and efficient file encryption and decryption.',
    url: 'https://share.g.im',
    siteName: 'SecureVault',
    // images: [
    //   {
    //     url: 'https://share.g.im/og-image.jpg',
    //     width: 1200,
    //     height: 630,
    //     alt: 'SecureVault'
    //   }
    // ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecureVault',
    description: 'SecureVault uses ECIES for secure and efficient file encryption and decryption.',
    creator: '@ttpos'
    // images: ['https://share.g.im/twitter-image.jpg']
  },
  // icons: {
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon.ico',
  //   apple: '/apple-touch-icon.png'
  // },
  alternates: {
    canonical: 'https://share.g.im'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={inter.className}>
        <Providers>
          <AppStateProvider>
            <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
              <div className="flex flex-col items-center flex-1">
                <Header />

                {/* <div className="w-full max-w-[520px] sm:min-w-[520px]"> */}
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
          </AppStateProvider>
        </Providers>
      </body>
    </html>
  )
}
