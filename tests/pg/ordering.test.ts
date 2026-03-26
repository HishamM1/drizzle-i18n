import { jsonb, pgTable, serial } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { orderByLocale } from "../../src/pg/ordering.js";

describe("pg orderByLocale", () => {
  const table = pgTable("products", {
    id: serial("id").primaryKey(),
    name: jsonb("name").$type<Record<string, string>>(),
  });

  it("generates an ORDER BY expression", () => {
    const expr = orderByLocale(table.name, "en");
    expect(expr).toBeDefined();
    expect(expr.getSQL()).toBeDefined();
  });

  it("supports desc direction", () => {
    const expr = orderByLocale(table.name, "en", "desc");
    expect(expr).toBeDefined();
  });

  it("handles hyphenated locales", () => {
    const expr = orderByLocale(table.name, "pt-BR");
    expect(expr).toBeDefined();
  });
});
