import { json, mysqlTable, serial } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { forLocale } from "../../src/mysql/query.js";

describe("mysql forLocale", () => {
  const categories = mysqlTable("categories", {
    id: serial("id").primaryKey(),
    name: json("name").$type<Record<string, string>>(),
  });

  it("generates a JSON_UNQUOTE(JSON_EXTRACT(...)) expression", () => {
    const expr = forLocale(categories.name, "en");
    expect(expr).toBeDefined();
    expect(expr.getSQL()).toBeDefined();
  });

  it("generates COALESCE for fallback", () => {
    const expr = forLocale(categories.name, "ar", { fallback: "en" });
    expect(expr).toBeDefined();
  });

  it("handles locale tags with hyphens", () => {
    const expr = forLocale(categories.name, "pt-BR");
    expect(expr).toBeDefined();
  });
});
