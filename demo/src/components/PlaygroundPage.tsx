import { useEffect } from 'react';

import { FixtureDemoPage } from './FixtureDemoPage';

interface PlaygroundPageProps {
  showToolbar?: boolean;
}

export function PlaygroundPage({ showToolbar = true }: PlaygroundPageProps) {
  useEffect(() => {
    document.title = 'Lightweight Order Flow Charts | Playground';
  }, []);

  return <FixtureDemoPage showToolbar={showToolbar} />;
}
