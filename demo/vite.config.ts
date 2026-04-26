import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: process.env.VITE_DEMO_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^lightweight-orderflow-charts\/react$/,
        replacement: fileURLToPath(new URL('../src/react.ts', import.meta.url)),
      },
      {
        find: /^lightweight-orderflow-charts$/,
        replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      },
    ],
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
});
