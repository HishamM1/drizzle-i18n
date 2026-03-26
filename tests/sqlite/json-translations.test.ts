import { getTableColumns } from "drizzle-orm";
import { integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import { jsonTranslations } from "../../src/sqlite/json-translations.js";

describe("sqlite jsonTranslations", () => {
  it("returns object with correct keys", () => {
    const result = jsonTranslations({
      name: { notNull: true },
      description: {},
    });

    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("description");
  });

  it("spreads into a sqliteTable correctly", () => {
    const table = sqliteTable("categories", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      ...jsonTranslations({
        name: { notNull: true },
        description: {},
      }),
    });

    const cols = getTableColumns(table);
    const colNames = Object.keys(cols);

    expect(colNames).toContain("id");
    expect(colNames).toContain("name");
    expect(colNames).toContain("description");
  });

  it("sets notNull on configured columns", () => {
    const table = sqliteTable("categories", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      ...jsonTranslations({
        name: { notNull: true },
        description: {},
      }),
    });

    const cols = getTableColumns(table);
    expect((cols as any).name.notNull).toBe(true);
    expect((cols as any).description.notNull).toBe(false);
  });

  it("columns have SQLiteTextJson type", () => {
    const table = sqliteTable("categories", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      ...jsonTranslations({
        name: { notNull: true },
      }),
    });

    const cols = getTableColumns(table);
    expect((cols as any).name.columnType).toBe("SQLiteTextJson");
  });
});
