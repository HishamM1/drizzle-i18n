---
"drizzle-i18n": minor
---

Expand the `createI18n()` factory surface to include all documented helpers, add strict locale validation for the new factory wrappers, tighten translation mutation payload typing, and fix SQLite sync transaction handling in `insertWithTranslations()`.

Also adds executable SQLite integration coverage for locale extraction, fallback joins, missing translation lookup, mutation helpers, JSON locale updates, and transaction rollback behavior.
