import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['lightweight-charts', 'react', 'react-dom'],
  target: 'es2022',
  splitting: false,
  treeshake: true,
});
