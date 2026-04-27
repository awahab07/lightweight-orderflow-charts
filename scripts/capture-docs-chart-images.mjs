import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'docs-site', 'public', 'images', 'chart-types');
const demoBaseUrl =
  process.env.DOCS_CAPTURE_DEMO_BASE_URL?.replace(/\/+$/, '') ??
  'http://127.0.0.1:4300/latest/demo';

const chartTypes = [
  {
    title: 'Basic Footprint Chart',
    filename: 'basic-footprint-chart.png',
    href: `${demoBaseUrl}/#/explore?preset=order-flow&theme=smooth-light`,
  },
  {
    title: 'Delta Stats',
    filename: 'delta-stats.png',
    href: `${demoBaseUrl}/#/explore?preset=order-flow-delta&theme=ivory-terminal`,
  },
  {
    title: 'Volume Nodes',
    filename: 'volume-nodes.png',
    href: `${demoBaseUrl}/#/explore?preset=session-map&theme=depth-heat`,
  },
  {
    title: 'Session Profile',
    filename: 'session-profile.png',
    href: `${demoBaseUrl}/#/explore?preset=absorption&theme=depth-heat`,
  },
  {
    title: 'Price Point of Control',
    filename: 'price-point-of-control.png',
    href: `${demoBaseUrl}/#/explore?preset=volume-profile-shape&theme=obsidian-minimal`,
  },
  {
    title: 'Heatmap Candles',
    filename: 'heatmap-candles.png',
    href: `${demoBaseUrl}/#/explore?preset=candle-heatmap&theme=paper-classic`,
  },
  {
    title: 'Delta Pivots',
    filename: 'delta-pivots.png',
    href: `${demoBaseUrl}/#/explore?preset=volume-delta-pivot&theme=obsidian-minimal`,
  },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const summary = [];

for (const chartType of chartTypes) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto(chartType.href, { waitUntil: 'networkidle' });
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1200);

  const chartContainer = page
    .locator('section')
    .filter({ has: page.locator('canvas') })
    .first();
  await chartContainer.screenshot({
    path: path.join(outputDir, chartType.filename),
  });

  summary.push(chartType);
  await page.close();
}

await writeFile(path.join(outputDir, 'index.json'), JSON.stringify(summary, null, 2));
await browser.close();

console.log(`Captured ${summary.length} chart images to ${outputDir}`);
