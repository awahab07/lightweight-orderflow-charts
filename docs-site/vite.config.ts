import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const docsRoot = fileURLToPath(new URL('./', import.meta.url));
const repoRoot = fileURLToPath(new URL('../', import.meta.url));

export default defineConfig({
  root: docsRoot,
  plugins: [react()],
  base: process.env.VITE_DOCS_BASE_PATH ?? '/',
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: '../docs-dist',
    emptyOutDir: true,
  },
});
