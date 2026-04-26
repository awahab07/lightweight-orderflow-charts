import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  plugins: [react()],
  base: process.env.VITE_DOCS_BASE_PATH ?? '/',
  build: {
    outDir: '../docs-dist',
    emptyOutDir: true,
  },
});
