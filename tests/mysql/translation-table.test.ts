import { getTableColumns, getTableName } from "drizzle-orm";
import { int, mysqlTable, serial, text, varchar } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { translationTable } from "../../src/mysql/translation-table.js";

describe("mysql translationTable", () => {
  const products = mysqlTable("products", {
    id: serial("id").primaryKey(),
    sku: varchar("sku", { length: 255 }).notNull(),
    price: int("price").notNull(),
  });

  it("generates a translations table with correct name", () => {
    const result = translationTable(products, {
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
    });

    expect(getTableName(result.table)).toBe("products_translations");
  });

  it("generates correct columns", () => {
    const result = translationTable(products, {
      name: varchar("name", { length: 255 }).notNull(),
    });

    const cols = getTableColumns(result.table);
    const colNames = Object.keys(cols);

    expect(colNames).toContain("id");
    expect(colNames).toContain("product_id");
    expect(colNames).toContain("locale");
    expect(colNames).toContain("name");
  });

  it("mirrors serial PK as bigint unsigned FK", () => {
    const result = translationTable(products, {
      name: varchar("name", { length: 255 }),
    });

    const cols = getTableColumns(result.table);
    // MySQL serial is BIGINT UNSIGNED — FK should be bigint
    const fkCol = (cols as any).product_id;
    expect(fkCol.columnType).toBe("MySqlBigInt53");
  });

  it("mirrors int PK type for FK column", () => {
    const intTable = mysqlTable("items", {
      id: int("id").autoincrement().primaryKey(),
    });

    const result = translationTable(intTable, {
      name: varchar("name", { length: 255 }),
    });

    const cols = getTableColumns(result.table);
    expect((cols as any).item_id.columnType).toBe("MySqlInt");
  });

  it("returns correct translatableColumnNames", () => {
    const result = translationTable(products, {
      name: varchar("name", { length: 255 }),
      description: text("description"),
    });

    expect(result.translatableColumnNames).toEqual(["name", "description"]);
  });

  it("supports custom options", () => {
    const result = translationTable(
      products,
      {
        name: varchar("name", { length: 255 }),
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
