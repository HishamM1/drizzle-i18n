# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in drizzle-i18n, please report it responsibly.

**Do not open a public issue.** Instead, email security concerns to the maintainers via the contact information in the repository.

We will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 7 days for confirmed vulnerabilities.

## Scope

drizzle-i18n is a pure TypeScript library with zero runtime dependencies and no network calls. The primary security surface is SQL expression generation — all SQL is built using Drizzle's parameterized `sql` tagged template, not string concatenation. The `escapeSqlString()` utility is used only for JSON path segments within `sql.raw()` calls.
