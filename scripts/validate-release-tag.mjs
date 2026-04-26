import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const rawTag = process.env.GITHUB_REF_NAME ?? process.argv[2] ?? '';
const tag = rawTag.replace(/^refs\/tags\//, '');

if (!tag) {
  console.error('Release tag validation requires a tag name.');
  process.exit(1);
}

if (!/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(tag)) {
  console.error(`Release tag "${tag}" is not a valid semver tag.`);
  process.exit(1);
}

const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const expectedTag = `v${packageJson.version}`;

if (tag !== expectedTag) {
  console.error(`Tag ${tag} does not match package.json version ${packageJson.version}.`);
  process.exit(1);
}

console.log(`Validated release tag ${tag}.`);
