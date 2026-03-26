import { getTableColumns } from "drizzle-orm";
import { jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { createI18n } from "../../src/pg/create-i18n.js";

const i18n = createI18n({
  defaultLocale: "en",
  locales: ["en", "ar", "fr"] as const,
});

const strictI18n = createI18n({
  defaultLocale: "en",
  locales: ["en", "ar", "fr"] as const,
  strict: true,
});

describe("pg createI18n", () => {
  it("returns an object with all helpers", () => {
    expect(i18n.translationTable).toBeTypeOf("function");
    expect(i18n.jsonTranslations).toBeTypeOf("function");
    expect(i18n.forLocale).toBeTypeOf("function");
    expect(i18n.withTranslation).toBeTypeOf("function");
    expect(i18n.upsertTranslation).toBeTypeOf("function");
    expect(i18n.setTranslations).toBeTypeOf("function");
    expect(i18n.updateLocale).toBeTypeOf("function");
  });

  it("stores config", () => {
    expect(i18n.config.defaultLocale).toBe("en");
    expect(i18n.config.locales).toEqual(["en", "ar", "fr"]);
  });

  it("translationTable works through the factory", () => {
    const products = pgTable("products", {
      id: serial("id").primaryKey(),
      sku: text("sku").notNull(),
    });

    const result = i18n.translationTable(products, {
      name: text("name").notNull(),
    });

    const cols = getTableColumns(result.table);
    expect(Object.keys(cols)).toContain("name");
    expect(result.translatableColumnNames).toEqual(["name"]);
  });

  it("jsonTranslations works through the factory", () => {
    const cols = i18n.jsonTranslations({
      name: { notNull: true },
      description: {},
    });

    expect(cols).toHaveProperty("name");
    expect(cols).toHaveProperty("description");
  });

  it("forLocale works through the factory", () => {
    const table = pgTable("test", {
      id: serial("id").primaryKey(),
      name: jsonb("name"),
    });

    const expr = i18n.forLocale(table.name, "ar", { fallback: "en" });
    expect(expr).toBeDefined();
  });

  describe("strict mode", () => {
    it("throws for unknown locale in forLocale", () => {
      const table = pgTable("test2", {
        id: serial("id").primaryKey(),
        name: jsonb("name"),
      });

      expect(() => {
        strictI18n.forLocale(table.name, "de" as any);
      }).toThrow('unknown locale "de"');
    });

    it("throws for unknown fallback locale", () => {
      const table = pgTable("test3", {
        id: serial("id").primaryKey(),
        name: jsonb("name"),
      });

      expect(() => {
        strictI18n.forLocale(table.name, "en", {
          fallback: "ja" as any,
        });
      }).toThrow('unknown locale "ja"');
    });

    it("does not throw for valid locales", () => {
      const table = pgTable("test4", {
        id: serial("id").primaryKey(),
        name: jsonb("name"),
      });

      expect(() => {
        strictI18n.forLocale(table.name, "ar", { fallback: "en" });
      }).not.toThrow();
    });
  });
});
