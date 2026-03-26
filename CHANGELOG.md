# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-03-25

Initial release.

### Features

- **Phase 1: Translation table strategy** -- `translationTable`, `withTranslation`, `translationTableRelations`, `makeLocaleColumn`, and `getTranslationTableName` for normalized localization using a separate translations table with foreign key relationships.
- **Phase 2: JSON column strategy** -- `jsonTranslations` and `forLocale` for denormalized localization using inline JSON columns keyed by locale.
- **Phase 3: Multi-dialect support** -- PostgreSQL (`jsonb`), MySQL (`json`), and SQLite (`text`) dialects supported across both strategies.
- **Phase 4: createI18n and strict locale typing** -- `createI18n<Locales>()` factory to produce locale-scoped helpers with compile-time enforcement of valid locale strings.
