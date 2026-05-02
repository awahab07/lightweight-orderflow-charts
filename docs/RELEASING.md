# Releasing And Publishing

This repository ships three public web surfaces from GitHub Pages:

- `latest/docs`
- `latest/storybook`
- `latest/demo`

It also publishes the npm package from semver tags using npm provenance.

## One-Time Setup

### 1. Configure the Git remote

If the local clone does not already have `origin`, add it:

```bash
git remote add origin https://github.com/awahab07/lightweight-orderflow-charts.git
git branch -M main
```

### 2. Enable GitHub Pages

In the GitHub repository settings:

1. Open **Settings -> Pages**
2. Set **Source** to **GitHub Actions**

The `pages.yml` workflow will then publish `site/latest/{docs,storybook,demo,data}` on every push to
`main`.

### 3. Prepare npm

The unscoped package name `lightweight-orderflow-charts` was available at the time this workflow was
prepared, but confirm again before the first publish.

One-time npm requirements:

1. Create or sign in to the npm account that will own the package.
2. Enable 2FA on that account.
3. In npm package settings, add a **Trusted Publisher** for:
   - GitHub owner: `awahab07`
   - Repository: `lightweight-orderflow-charts`
   - Workflow file: `publish.yml`

If npm refuses the first trusted publish for a brand-new package, perform one manual bootstrap
publish from a local checkout:

```bash
npm login
npm publish --access public
```

After that first publish succeeds, subsequent releases can use the GitHub Actions trusted-publishing
flow.

## Release Workflow

1. Make sure `main` is clean and up to date.
2. Run the local verification bundle:

```bash
npm run release:check
```

3. Bump the version with semver:

```bash
npm version patch
# or: npm version minor
# or: npm version major
```

4. Push `main` and the generated tag:

```bash
git push origin main --follow-tags
```

5. Watch the workflows:
   - `pages.yml` refreshes the `latest/*` Pages content from `main`
   - `publish.yml` validates the tag and runs `npm publish --provenance --access public`

## Semver Tag Contract

`publish.yml` accepts tags that match `v*.*.*` and validates that:

- the tag is valid semver
- the tag matches `package.json` exactly

For example, package version `0.2.0` must be published from tag `v0.2.0`.

## Package Contents

The published package is constrained by the `files` field in `package.json`. That is the primary
packaging contract, so a separate `.npmignore` file is not required right now.

Before any release, inspect the tarball contents explicitly:

```bash
npm pack --dry-run
```

## Notes

- `demo`, `docs-site`, Storybook stories, raw fixture metadata, and local connector caches are not
  part of the npm package.
- The root `NOTICE` file and `docs/ATTRIBUTION.md` must remain available because
  [`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts) carries
  upstream attribution requirements.
