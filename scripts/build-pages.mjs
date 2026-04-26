import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = path.join(rootDir, 'site');
const latestDir = path.join(siteDir, 'latest');
const tempDir = path.join(rootDir, '.site-tmp');
const storybookOutputDir = path.join(tempDir, 'storybook');
const demoOutputDir = path.join(rootDir, 'demo-dist');
const docsOutputDir = path.join(rootDir, 'docs-dist');
const dataOutputDir = path.join(rootDir, 'data', 'market');

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function resolveRepositoryBasePath() {
  const configuredBase = process.env.PAGES_REPOSITORY_BASE?.trim();
  if (configuredBase) {
    return configuredBase === '/' ? '' : configuredBase.replace(/\/+$/, '');
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
  return repositoryName ? `/${repositoryName}` : '';
}

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function createRedirectDocument(target) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>Redirecting to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`;
}

async function main() {
  const repoBasePath = resolveRepositoryBasePath();
  const latestBasePath = `${repoBasePath}/latest`;

  await rm(siteDir, { recursive: true, force: true });
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(latestDir, { recursive: true });

  run(npmCommand(), ['run', 'docs:build'], {
    VITE_DOCS_BASE_PATH: `${latestBasePath}/docs/`,
  });

  run(npmCommand(), ['run', 'build-storybook', '--', '--output-dir', storybookOutputDir], {
    STORYBOOK_BASE_PATH: `${latestBasePath}/storybook/`,
  });

  run(npmCommand(), ['run', 'demo:build'], {
    VITE_DEMO_BASE_PATH: `${latestBasePath}/demo/`,
    VITE_DEMO_ENABLE_CONNECT: 'false',
  });

  await cp(docsOutputDir, path.join(latestDir, 'docs'), { recursive: true });
  await cp(storybookOutputDir, path.join(latestDir, 'storybook'), { recursive: true });
  await cp(demoOutputDir, path.join(latestDir, 'demo'), { recursive: true });
  await cp(dataOutputDir, path.join(latestDir, 'data'), { recursive: true });

  await writeFile(path.join(siteDir, '.nojekyll'), '');
  await writeFile(path.join(siteDir, 'index.html'), createRedirectDocument('./latest/docs/'));
  await writeFile(path.join(latestDir, 'index.html'), createRedirectDocument('./docs/'));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
