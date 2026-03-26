/**
 * Playground — run with: npx tsx playground.ts
 *
 * Uses SQLite (in-memory) so no database server is needed.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { eq, sql } from "drizzle-orm";
import {
  translationTable,
  jsonTranslations,
  forLocale,
  withTranslation,
  localizeResults,
  upsertTranslation,
  setTranslations,
  updateLocale,
  insertWithTranslations,
  missingTranslations,
  orderByLocale,
  exportTranslations,
  importTranslations,
} from "./src/sqlite.js";

// ── Schema ──────────────────────────────────────────────

const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull(),
  price: integer("price").notNull(),
});

const productI18n = translationTable(products, {
  name: text("name").notNull(),
  description: text("description"),
});

const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ...jsonTranslations({
    name: { notNull: true },
    description: {},
  }),
});

// ── Database ────────────────────────────────────────────

const sqlite = new Database(":memory:");
const db = drizzle(sqlite);

// Create tables manually (no drizzle-kit in playground)
sqlite.exec(`
  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    price INTEGER NOT NULL
  );
  CREATE TABLE products_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    locale TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    UNIQUE(product_id, locale)
  );
  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT
  );
`);

// ── Demo ────────────────────────────────────────────────

async function main() {
  console.log("=== drizzle-i18n Playground ===\n");

  // 1. Insert products WITH translations in one call
  const product1 = insertWithTranslations(db, products, productI18n, {
    values: { sku: "PHONE-01", price: 999 },
    translations: {
      en: { name: "Smartphone", description: "A premium smartphone" },
      ar: { name: "هاتف ذكي", description: "هاتف ذكي متميز" },
    },
  });
  console.log("Inserted product 1:", product1);

  const product2 = insertWithTranslations(db, products, productI18n, {
    values: { sku: "TABLET-02", price: 599 },
    translations: {
      en: { name: "Tablet", description: "A powerful tablet" },
    },
  });
  console.log("Inserted product 2:", product2, "\n");

  // 3. Query with withTranslation (locale in JOIN, not WHERE)
  const arProducts = await withTranslation(db, products, productI18n, {
    locale: "ar",
    fallback: "en",
  });
  console.log("Arabic products (with English fallback):");
  console.table(arProducts);

  // 4. Missing translations
  const missingAr = await missingTranslations(db, products, productI18n, "ar");
  console.log("Products missing Arabic translation:");
  console.table(missingAr);

  // 5. Bulk set translations
  await setTranslations(db, productI18n, {
    product_id: 2,
    translations: {
      ar: { name: "جهاز لوحي", description: "جهاز لوحي قوي" },
      fr: { name: "Tablette", description: "Une tablette puissante" },
    },
  });
  console.log("\nBulk-set Arabic + French for product 2\n");

  // 6. Export all translations
  const allTranslations = await db.select().from(productI18n.table);
  const exported = exportTranslations(allTranslations, productI18n, "product_id");
  console.log("Exported translations:");
  console.log(JSON.stringify(exported, null, 2));

  // 7. JSON column strategy
  console.log("\n--- JSON Column Strategy ---\n");

  db.insert(categories).values([
    { name: { en: "Electronics", ar: "إلكترونيات" } as any, description: { en: "All electronics" } as any },
    { name: { en: "Books", ar: "كتب" } as any, description: { en: "All books" } as any },
  ]).run();

  // Extract a single locale
  const arCategories = await db.select({
    id: categories.id,
    name: forLocale(categories.name, "ar", { fallback: "en" }),
  }).from(categories);
  console.log("Arabic categories:");
  console.table(arCategories);

  // Order by translated name
  const sorted = await db.select({
    id: categories.id,
    name: forLocale(categories.name, "en"),
  }).from(categories).orderBy(orderByLocale(categories.name, "en"));
  console.log("Categories sorted by English name:");
  console.table(sorted);

  // Update a single locale in JSON
  await updateLocale(db, categories, categories.name, {
    where: eq(categories.id, 1),
    locale: "fr",
    value: "Electronique",
  });
  const updated = await db.select().from(categories).where(eq(categories.id, 1));
  console.log("Category 1 after adding French:");
  console.log(updated[0].name);

  console.log("\n=== Done! ===");
}

main().catch(console.error);
