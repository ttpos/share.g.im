import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

const rootDir = resolve(__dirname);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
  ],
  publicDir: resolve(rootDir, 'public'),
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true
        })
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/types": path.resolve(__dirname, "./src/types"),
      buffer: 'buffer/',
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
