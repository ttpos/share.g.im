import React from 'react';
import { Toaster } from 'sonner';
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { Providers } from '@/components/Providers'

const App: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
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
  );
};

export default App;
