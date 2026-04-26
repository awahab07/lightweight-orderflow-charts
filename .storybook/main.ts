import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  staticDirs: [{ from: '../data/market', to: '/data' }],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
  },
  docs: {
    defaultName: 'Documentation',
  },
  async viteFinal(currentConfig) {
    return mergeConfig(currentConfig, {
      base: process.env.STORYBOOK_BASE_PATH ?? currentConfig.base,
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
    });
  },
};

export default config;
