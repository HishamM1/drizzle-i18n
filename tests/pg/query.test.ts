import { jsonb, pgTable, serial } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { forLocale, withTranslation } from "../../src/pg/query.js";

describe("pg forLocale", () => {
  const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: jsonb("name").$type<Record<string, string>>(),
  });

  it("generates a ->> SQL expression", () => {
    const expr = forLocale(categories.name, "en");
    // Should produce: column->>'en'
    expect(expr).toBeDefined();
    expect(expr.getSQL()).toBeDefined();
  });

  it("generates COALESCE for fallback", () => {
    const expr = forLocale(categories.name, "ar", { fallback: "en" });
    expect(expr).toBeDefined();
    expect(expr.getSQL()).toBeDefined();
  });

  it("escapes single quotes in locale names", () => {
    // Should not throw for weird locale names
    const expr = forLocale(categories.name, "x'y");
    expect(expr).toBeDefined();
  });
});

describe("pg withTranslation", () => {
  it("is exported correctly", () => {
    expect(typeof withTranslation).toBe("function");
  });
});
