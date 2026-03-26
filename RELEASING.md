# Releasing

## One-time setup

1. Fill in `repository`, `homepage`, and `bugs` in `package.json`.
2. Add an `NPM_TOKEN` secret in GitHub Actions.
3. Make sure the package owner has access to publish `drizzle-i18n`.

## Before a release

```bash
npm run release:check
```

This runs:

- lint, typecheck, and tests
- package build
- `npm pack --dry-run`
- a tarball smoke test that installs the packed artifact into a temp project and verifies the main exports

## Releasing with Changesets

1. Add a changeset:

```bash
npx changeset
```

2. Merge to `main`.
3. The `Release` GitHub Actions workflow will either:
   - open/update a version PR, or
   - publish to npm when there are pending version changes on `main`

## Manual publish fallback

```bash
npm run release:check
npm publish
```
