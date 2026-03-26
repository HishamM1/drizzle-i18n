import { getTableColumns, getTableName } from "drizzle-orm";
import { integer, pgTable, serial, text, uuid } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { translationTable } from "../../src/pg/translation-table.js";

describe("pg translationTable", () => {
  const products = pgTable("products", {
    id: serial("id").primaryKey(),
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
      description: text("description"),
    });

    const cols = getTableColumns(result.table);
    const colNames = Object.keys(cols);

    expect(colNames).toContain("id");
    expect(colNames).toContain("product_id");
    expect(colNames).toContain("locale");
    expect(colNames).toContain("name");
    expect(colNames).toContain("description");
  });

  it("sets id as primary key", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).id.primary).toBe(true);
  });

  it("sets FK column as notNull", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).product_id.notNull).toBe(true);
  });

  it("sets locale column as notNull", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).locale.notNull).toBe(true);
  });

  it("returns correct translatableColumnNames", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
      description: text("description"),
    });

    expect(result.translatableColumnNames).toEqual(["name", "description"]);
  });

  it("returns fkColumn and localeColumn references", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
    });

    expect(result.fkColumn).toBeDefined();
    expect(result.localeColumn).toBeDefined();
  });

  it("returns relations objects", () => {
    const result = translationTable(products, {
      name: text("name").notNull(),
    });

    expect(result.translationsRelations).toBeDefined();
    expect(result.parentRelations).toBeDefined();
    expect(result.parentRelationConfig).toBeTypeOf("function");
  });

  it("supports custom table name", () => {
    const result = translationTable(
      products,
      { name: text("name") },
      {
        tableName: "product_i18n",
      },
    );

    expect(getTableName(result.table)).toBe("product_i18n");
  });

  it("supports custom FK and locale column names", () => {
    const result = translationTable(
      products,
      { name: text("name") },
      {
        parentIdColumn: "ref_id",
        localeColumn: "lang",
      },
    );

    const cols = getTableColumns(result.table);
    const colNames = Object.keys(cols);

    expect(colNames).toContain("ref_id");
    expect(colNames).toContain("lang");
    expect(colNames).not.toContain("product_id");
    expect(colNames).not.toContain("locale");
  });

  it("mirrors UUID PK type for FK column", () => {
    const uuidTable = pgTable("items", {
      id: uuid("id").defaultRandom().primaryKey(),
    });

    const result = translationTable(uuidTable, {
      name: text("name").notNull(),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).item_id.columnType).toBe("PgUUID");
  });

  it("mirrors text PK type for FK column", () => {
    const slugTable = pgTable("pages", {
      slug: text("slug").primaryKey(),
    });

    const result = translationTable(slugTable, {
      title: text("title").notNull(),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).page_id.columnType).toBe("PgText");
  });
});
