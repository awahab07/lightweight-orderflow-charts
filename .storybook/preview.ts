import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Overview', 'Full Charts', 'Study Components', 'Theming and Styling'],
      },
    },
    docs: {
      toc: true,
    },
  },
};

export default preview;
