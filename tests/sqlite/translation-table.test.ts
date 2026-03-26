import { getTableColumns, getTableName } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import { translationTable } from "../../src/sqlite/translation-table.js";

describe("sqlite translationTable", () => {
  const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sku: text("sku").notNull(),
    price: integer("price").notNull(),
  });

  it("generates a translations table with correct name", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
      description: text("description"),
    });

    expect(getTableName(result.table)).toBe("products_translations");
  });

  it("generates correct columns", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
    });

    const cols = getTableColumns(result.table);
    const colNames = Object.keys(cols);

    expect(colNames).toContain("id");
    expect(colNames).toContain("product_id");
    expect(colNames).toContain("locale");
    expect(colNames).toContain("name");
  });

  it("mirrors integer PK type for FK column", () => {
    const result = translationTable(products, {
      name: text("name"),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).product_id.columnType).toBe("SQLiteInteger");
  });

  it("mirrors text PK type for FK column", () => {
    const slugTable = sqliteTable("pages", {
      slug: text("slug").primaryKey(),
    });

    const result = translationTable(slugTable, {
      title: text("title").notNull(),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).page_id.columnType).toBe("SQLiteText");
  });

  it("returns correct translatableColumnNames", () => {
    const result = translationTable(products, {
      name: text("name"),
      description: text("description"),
    });

    expect(result.translatableColumnNames).toEqual(["name", "description"]);
  });

  it("supports custom options", () => {
    const result = translationTable(
      products,
      {
        name: text("name"),
      },
      {
        tableName: "product_i18n",
        parentIdColumn: "ref_id",
        localeColumn: "lang",
      },
    );

    expect(getTableName(result.table)).toBe("product_i18n");
    const cols = getTableColumns(result.table);
    expect(Object.keys(cols)).toContain("ref_id");
    expect(Object.keys(cols)).toContain("lang");
  });
});
