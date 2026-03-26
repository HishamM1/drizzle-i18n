import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import { forLocale } from "../../src/sqlite/query.js";

describe("sqlite forLocale", () => {
  const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { mode: "json" }).$type<Record<string, string>>(),
  });

  it("generates a json_extract expression", () => {
    const expr = forLocale(categories.name, "en");
    expect(expr).toBeDefined();
    expect(expr.getSQL()).toBeDefined();
  });

  it("generates COALESCE for fallback", () => {
    const expr = forLocale(categories.name, "ar", { fallback: "en" });
    expect(expr).toBeDefined();
  });

  it("handles locale tags with hyphens", () => {
    const expr = forLocale(categories.name, "zh-Hans");
    expect(expr).toBeDefined();
  });
});
