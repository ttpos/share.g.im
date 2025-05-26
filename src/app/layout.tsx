import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import '@/app/globals.css'
import { Providers } from '@/components/providers'
import Aurora from '@/components/reactbits/Aurora'
import Particles from '@/components/reactbits/Particles'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

const BackgroundEffects = () => (
  <>
    <div className="fixed inset-0">
      <Aurora
        colorStops={['#4C00FF', '#97FFF4', '#FF3D9A']}
        blend={3.3}
        amplitude={0.3}
        speed={1.3}
      />
    </div>
    <div className="fixed inset-0">
      <Particles
        particleColors={['#ffffff', '#ffffff']}
        particleCount={400}
        particleSpread={10}
        speed={0.05}
        particleBaseSize={100}
        moveParticlesOnHover={false}
        alphaParticles={false}
        disableRotation={false}
      />
    </div>
  </>
)

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
          <BackgroundEffects />
          <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
            <div className="container mx-auto px-4 py-12 flex flex-col items-center flex-1">
              <Header />

              {children}
            </div>
          </main>
          <Toaster
            richColors
            position="top-right"
            duration={3000}
          />
        </Providers>
      </body>
    </html>
  )
}
