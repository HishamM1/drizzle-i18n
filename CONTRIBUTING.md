# Contributing to drizzle-i18n

Thank you for your interest in contributing. This guide covers the basics to get you started.

## Prerequisites

- Node.js 18 or later
- npm

## Setup

```bash
git clone https://github.com/your-org/drizzle-i18n.git
cd drizzle-i18n
npm install
```

## Development

Run the test suite in watch mode during development:

```bash
npm run test:watch
```

Type-check the project:

```bash
npm run typecheck
```

Build the project:

```bash
npm run build
```

## Pull Request Process

1. Create a feature branch from `main`.
2. Make your changes and ensure all tests pass.
3. Add or update tests for any new or changed behavior.
4. If your change affects the public API, include a changeset (`npx changeset`).
5. Open a pull request against `main`.

All PRs require passing CI (tests, type-checking, build) before merging.

## Code Style

Code style is enforced automatically by tooling. There is no need to configure your editor manually -- just run the existing lint and format scripts if available.
