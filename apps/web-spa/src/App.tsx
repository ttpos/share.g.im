import React from 'react';
import { Toaster } from 'sonner';
import { Providers } from './components/Providers';
import Header from './components/Header';
import Aurora from './components/reactbits/Aurora';
import Particles from './components/reactbits/Particles';

// Background effects component
const BackgroundEffects: React.FC = () => (
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
);

const App: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Providers>
      <BackgroundEffects />
      <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
        <div className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center flex-1">
          <Header />
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" duration={3000} />
    </Providers>
  );
};

export default App;
