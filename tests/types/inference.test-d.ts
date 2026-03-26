import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { describe, expectTypeOf, it } from "vitest";
import { jsonTranslations } from "../../src/pg/json-translations.js";
import { translationTable } from "../../src/pg/translation-table.js";

describe("type inference", () => {
  const products = pgTable("products", {
    id: serial("id").primaryKey(),
    sku: text("sku").notNull(),
  });

  const productI18n = translationTable(products, {
    name: text("name").notNull(),
    description: text("description"),
  });

  it("translatableColumnNames has literal type", () => {
    expectTypeOf(productI18n.translatableColumnNames).toEqualTypeOf<
      Array<"name" | "description">
    >();
  });

  it("$inferSelect includes translatable columns", () => {
    type Select = typeof productI18n.table.$inferSelect;
    expectTypeOf<Select>().toHaveProperty("name");
    expectTypeOf<Select>().toHaveProperty("description");
    expectTypeOf<Select>().toHaveProperty("id");
  });

  it("jsonTranslations result has correct keys", () => {
    const cols = jsonTranslations({
      title: { notNull: true },
      subtitle: {},
    });

    expectTypeOf(cols).toHaveProperty("title");
    expectTypeOf(cols).toHaveProperty("subtitle");
  });

  it("jsonTranslations spread into table produces correct $inferSelect", () => {
    const categories = pgTable("categories", {
      id: serial("id").primaryKey(),
      ...jsonTranslations({
        name: { notNull: true },
        description: {},
      }),
    });

    type CatSelect = typeof categories.$inferSelect;
    expectTypeOf<CatSelect>().toHaveProperty("id");
    expectTypeOf<CatSelect>().toHaveProperty("name");
    expectTypeOf<CatSelect>().toHaveProperty("description");
  });
});
