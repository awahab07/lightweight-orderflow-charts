import { useEffect } from 'react';

import { FixtureDemoPage } from './FixtureDemoPage';

export function PlaygroundPage() {
  useEffect(() => {
    document.title = 'Lightweight Order Flow Charts | Playground';
  }, []);

  return <FixtureDemoPage />;
}
