# drizzle-i18n

Type-safe database localization for [Drizzle ORM](https://orm.drizzle.team/).

## Features

- **Two localization strategies** -- separate translation table (normalized) or JSON column (denormalized)
- **Three dialects** -- PostgreSQL (`jsonb`), MySQL (`json`), SQLite (`text` with `mode: "json"`)
- **Fully type-safe** -- `$inferSelect`, `$inferInsert`, locale keys, and query results all carry correct types
- **Zero runtime dependencies** -- only `drizzle-orm` as a peer dependency
- **drizzle-kit compatible** -- generated tables work with `drizzle-kit generate` / `push` / `migrate`

## Installation

```bash
npm i drizzle-i18n
```

Requires `drizzle-orm` >= 0.35.0 as a peer dependency.

## Quick Start

### Strategy 1: Translation Table

Stores translations in a separate `{entity}_translations` table with a foreign key, locale column, and translatable fields.

```ts
import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { translationTable, withTranslation } from "drizzle-i18n/pg";

// 1. Define the base entity
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull(),
  price: integer("price").notNull(),
});

// 2. Declare translatable fields
const productI18n = translationTable(products, {
  name: text("name").notNull(),
  description: text("description"),
});

// 3. Export table + relations (drizzle-kit needs the table export)
export const productTranslations = productI18n.table;
export const productTranslationsRelations = productI18n.translationsRelations;
export const productsRelations = productI18n.parentRelations;

// 4. Query with a locale (locale filter is in the JOIN, not WHERE)
const rows = await withTranslation(db, products, productI18n, {
  locale: "ar",
  fallback: "en",
}).where(eq(products.id, 1));
// => [{ id: 1, sku: "ABC", price: 100, name: "هاتف", description: "..." }]
```

### Strategy 2: JSON Column

Stores translations inline as JSON objects (`{ "en": "...", "ar": "..." }`).

```ts
import { pgTable, serial, integer } from "drizzle-orm/pg-core";
import { jsonTranslations, forLocale } from "drizzle-i18n/pg";

// 1. Spread JSON columns into the table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  sortOrder: integer("sort_order"),
  ...jsonTranslations({
    name: { notNull: true },
    description: {},
  }),
});
// Produces: name jsonb NOT NULL, description jsonb

// 2. Extract a single locale in queries
const rows = await db.select({
  id: categories.id,
  name: forLocale(categories.name, "ar", { fallback: "en" }),
}).from(categories);
// => [{ id: 1, name: "إلكترونيات" }]
```

## Strict Locale Typing

Use `createI18n()` to lock down valid locales across all helpers:

```ts
import { createI18n } from "drizzle-i18n/pg";

const i18n = createI18n({
  defaultLocale: "en",
  locales: ["en", "ar", "fr"] as const,
  strict: true, // runtime validation
});

// All helpers are locale-scoped
i18n.forLocale(col, "ar");   // OK
i18n.forLocale(col, "de");   // Type error + runtime error (strict mode)

// jsonTranslations columns are typed as { en: string } & Partial<{ ar: string; fr: string }>
```

## Mutation Helpers

```ts
import {
  insertWithTranslations, upsertTranslation,
  setTranslations, updateLocale,
} from "drizzle-i18n/pg";

// Insert parent + translations in one atomic call (transactional)
await insertWithTranslations(db, products, productI18n, {
  values: { sku: "ABC", price: 999 },
  translations: {
    en: { name: "Phone", description: "A phone" },
    ar: { name: "هاتف", description: "هاتف ذكي" },
  },
});

// Upsert a single locale (ON CONFLICT DO UPDATE)
await upsertTranslation(db, productI18n, {
  product_id: 1,
  locale: "fr",
  name: "Telephone",
});

// Bulk upsert multiple locales (partial -- only provided locales are touched)
await setTranslations(db, productI18n, {
  product_id: 1,
  translations: {
    en: { name: "Smartphone" },
    ar: { name: "هاتف ذكي", description: "وصف المنتج" },
  },
});

// Update a single locale in a JSON column
await updateLocale(db, categories, categories.name, {
  where: eq(categories.id, 1),
  locale: "fr",
  value: "Electronique",
});
```

## Relational Query Post-Processing

```ts
import { localizeResults } from "drizzle-i18n/pg";

const rows = await db.query.products.findMany({ with: { translations: true } });
const localized = localizeResults(rows, productI18n, {
  locale: "ar",
  fallback: "en",
});
// => [{ id: 1, sku: "ABC", name: "هاتف", description: "..." }]
// translations array is stripped, fields are flattened
```

## API Reference

### Schema

| Function | Strategy | Description |
| --- | --- | --- |
| `translationTable(parent, columns, opts?)` | Separate table | Generate `{entity}_translations` table + relations |
| `jsonTranslations(fields)` | JSON column | Generate JSON/JSONB columns to spread into a table |

### Queries

| Function | Strategy | Description |
| --- | --- | --- |
| `forLocale(column, locale, opts?)` | JSON column | SQL expression extracting a locale value as a plain string |
| `withTranslation(db, parent, i18nResult, opts)` | Separate table | Locale-aware LEFT JOIN -- returns flat rows with translated fields |
| `localizeResults(rows, i18nResult, opts)` | Separate table | Post-process relational query results into flat rows |
| `missingTranslations(db, parent, i18nResult, locale)` | Separate table | Find entities missing a translation for a locale |
| `orderByLocale(column, locale, direction?)` | JSON column | ORDER BY expression on a translated JSON column |

### Mutations

| Function | Strategy | Description |
| --- | --- | --- |
| `insertWithTranslations(db, parent, i18nResult, data)` | Separate table | Insert parent + translations atomically (transactional) |
| `upsertTranslation(db, i18nResult, data)` | Separate table | Insert or update a single locale row |
| `setTranslations(db, i18nResult, data)` | Separate table | Bulk upsert multiple locales (partial -- safe for different column subsets) |
| `updateLocale(db, table, column, opts)` | JSON column | Partial JSON update for one locale |

### Utilities

| Function | Description |
| --- | --- |
| `createI18n(config)` | Factory with strict locale typing across all helpers |
| `exportTranslations(rows, i18nResult, fkKey)` | Convert translation rows to locale-keyed format |
| `importTranslations(data, fkKey)` | Convert locale-keyed format back to flat rows |

## Dialect Support

Import from the dialect-specific entry point:

| Dialect | Import | JSON Column Type |
| --- | --- | --- |
| PostgreSQL | `drizzle-i18n/pg` | `jsonb` |
| MySQL | `drizzle-i18n/mysql` | `json` |
| SQLite | `drizzle-i18n/sqlite` | `text({ mode: "json" })` |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE)
