# Changelog

## 0.2.0

### Minor Changes

- dee2dc5: Expand the `createI18n()` factory surface to include all documented helpers, add strict locale validation for the new factory wrappers, tighten translation mutation payload typing, and fix SQLite sync transaction handling in `insertWithTranslations()`.

  Also adds executable SQLite integration coverage for locale extraction, fallback joins, missing translation lookup, mutation helpers, JSON locale updates, and transaction rollback behavior.

## 0.1.1

### Patch Changes

- fix: sqlite insertWithTranslations now works with both sync (better-sqlite3) and async (libsql/turso) drivers

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-03-25

Initial release.

### Features

- **Phase 1: Translation table strategy** -- `translationTable`, `withTranslation`, `translationTableRelations`, `makeLocaleColumn`, and `getTranslationTableName` for normalized localization using a separate translations table with foreign key relationships.
- **Phase 2: JSON column strategy** -- `jsonTranslations` and `forLocale` for denormalized localization using inline JSON columns keyed by locale.
- **Phase 3: Multi-dialect support** -- PostgreSQL (`jsonb`), MySQL (`json`), and SQLite (`text`) dialects supported across both strategies.
- **Phase 4: createI18n and strict locale typing** -- `createI18n<Locales>()` factory to produce locale-scoped helpers with compile-time enforcement of valid locale strings.
