import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

import brandImageUrl from '../docs/images/branding/product-icon.png';

const brandUrl =
  typeof window === 'undefined' ? '/' : new URL('./', window.location.href).toString();

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Lightweight Order Flow Charts',
    brandUrl,
    brandImage: brandImageUrl,
    brandTarget: '_self',
  }),
});
