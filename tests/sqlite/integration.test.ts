import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { jsonTranslations } from "../../src/sqlite/json-translations.js";
import { missingTranslations } from "../../src/sqlite/missing.js";
import {
  insertWithTranslations,
  setTranslations,
  updateLocale,
  upsertTranslation,
} from "../../src/sqlite/mutate.js";
import { orderByLocale } from "../../src/sqlite/ordering.js";
import { forLocale, withTranslation } from "../../src/sqlite/query.js";
import { translationTable } from "../../src/sqlite/translation-table.js";

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
  slug: text("slug").notNull(),
  ...jsonTranslations({
    name: { notNull: true },
  }),
});

describe("sqlite executable integration", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    db = drizzle(sqlite);
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
        slug TEXT NOT NULL,
        name TEXT NOT NULL
      );
    `);
  });

  afterEach(() => {
    sqlite.close();
  });

  it("executes JSON locale extraction, fallback, and ordering", async () => {
    await db.insert(categories).values([
      { slug: "phones", name: { en: "Phones", ar: "هواتف" } },
      { slug: "audio", name: { en: "Audio" } },
    ]);

    const localized = await db
      .select({
        slug: categories.slug,
        name: forLocale(categories.name, "ar", { fallback: "en" }),
      })
      .from(categories)
      .orderBy(orderByLocale(categories.name, "en"));

    expect(localized).toEqual([
      { slug: "audio", name: "Audio" },
      { slug: "phones", name: "هواتف" },
    ]);
  });

  it("executes translation table joins with field-level fallback", async () => {
    await db.insert(products).values({ sku: "phone", price: 999 });
    await db.insert(productI18n.table).values([
      {
        product_id: 1,
        locale: "en",
        name: "Phone",
        description: "Smartphone",
      },
      {
        product_id: 1,
        locale: "ar",
        name: "هاتف",
        description: null,
      },
    ]);

    const rows = await withTranslation(db, products, productI18n, {
      locale: "ar",
      fallback: "en",
    }).where(eq(products.id, 1));

    expect(rows).toEqual([
      {
        id: 1,
        sku: "phone",
        price: 999,
        name: "هاتف",
        description: "Smartphone",
      },
    ]);
  });

  it("executes missing translation lookup", async () => {
    await db.insert(products).values([
      { sku: "phone", price: 999 },
      { sku: "tablet", price: 1200 },
    ]);
    await db.insert(productI18n.table).values({
      product_id: 1,
      locale: "ar",
      name: "هاتف",
    });

    const missing = await missingTranslations(db, products, productI18n, "ar");

    expect(missing).toEqual([{ id: 2, sku: "tablet", price: 1200 }]);
  });

  it("executes translation upserts and JSON locale updates", async () => {
    await db.insert(products).values({ sku: "phone", price: 999 });
    await upsertTranslation(db, productI18n, {
      product_id: 1,
      locale: "en",
      name: "Phone",
      description: "Smartphone",
    });
    await setTranslations(db, productI18n, {
      product_id: 1,
      translations: {
        en: { name: "Smartphone" },
        ar: { name: "هاتف" },
      },
    });

    const translated = await db
      .select({
        locale: productI18n.table.locale,
        name: productI18n.table.name,
        description: productI18n.table.description,
      })
      .from(productI18n.table)
      .orderBy(productI18n.table.locale);

    expect(translated).toEqual([
      { locale: "ar", name: "هاتف", description: null },
      { locale: "en", name: "Smartphone", description: "Smartphone" },
    ]);

    await db.insert(categories).values({
      slug: "phones",
      name: { en: "Phones" },
    });
    await updateLocale(db, categories, categories.name, {
      where: eq(categories.id, 1),
      locale: "ar",
      value: "هواتف",
    });

    const [category] = await db
      .select({
        name: forLocale(categories.name, "ar"),
      })
      .from(categories);

    expect(category.name).toBe("هواتف");
  });

  it("executes insertWithTranslations in a sync transaction", () => {
    const inserted = insertWithTranslations(db, products, productI18n, {
      values: { sku: "tablet", price: 1200 },
      translations: {
        en: { name: "Tablet", description: "Portable screen" },
        ar: { name: "حاسوب لوحي" },
      },
    });

    expect(inserted).toEqual({ id: 1, sku: "tablet", price: 1200 });

    const translations = sqlite
      .prepare(
        "SELECT product_id, locale, name, description FROM products_translations ORDER BY locale",
      )
      .all();

    expect(translations).toEqual([
      {
        product_id: 1,
        locale: "ar",
        name: "حاسوب لوحي",
        description: null,
      },
      {
        product_id: 1,
        locale: "en",
        name: "Tablet",
        description: "Portable screen",
      },
    ]);
  });

  it("rolls back insertWithTranslations when a translation row fails", () => {
    expect(() =>
      insertWithTranslations(db, products, productI18n, {
        values: { sku: "broken", price: 1 },
        translations: {
          en: { description: "Missing required name" },
        },
      }),
    ).toThrow();

    const productCount = sqlite.prepare("SELECT COUNT(*) AS count FROM products").get() as {
      count: number;
    };
    expect(productCount.count).toBe(0);
  });
});
