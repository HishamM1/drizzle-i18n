import { getTableColumns } from "drizzle-orm";
import { pgTable, serial } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { jsonTranslations } from "../../src/pg/json-translations.js";

describe("pg jsonTranslations", () => {
  it("returns object with correct keys", () => {
    const result = jsonTranslations({
      name: { notNull: true },
      description: {},
    });

    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("description");
    expect(Object.keys(result)).toEqual(["name", "description"]);
  });

  it("spreads into a pgTable correctly", () => {
    const table = pgTable("categories", {
      id: serial("id").primaryKey(),
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
    const table = pgTable("categories", {
      id: serial("id").primaryKey(),
      ...jsonTranslations({
        name: { notNull: true },
        description: {},
      }),
    });

    const cols = getTableColumns(table);
    expect((cols as any).name.notNull).toBe(true);
    expect((cols as any).description.notNull).toBe(false);
  });

  it("columns have jsonb type", () => {
    const table = pgTable("categories", {
      id: serial("id").primaryKey(),
      ...jsonTranslations({
        name: { notNull: true },
      }),
    });

    const cols = getTableColumns(table);
    expect((cols as any).name.columnType).toBe("PgJsonb");
  });
});
