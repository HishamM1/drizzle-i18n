import { pgTable, serial } from "drizzle-orm/pg-core";
import { describe, expectTypeOf, it } from "vitest";
import { createI18n } from "../../src/pg/create-i18n.js";
import { jsonTranslations } from "../../src/pg/json-translations.js";

describe("jsonTranslations type inference through pgTable", () => {
  it("$inferSelect carries correct types when spread into pgTable", () => {
    const table = pgTable("test", {
      id: serial("id").primaryKey(),
      ...jsonTranslations({
        name: { notNull: true },
        description: {},
      }),
    });

    type Select = typeof table.$inferSelect;

    // Keys exist
    expectTypeOf<Select>().toHaveProperty("id");
    expectTypeOf<Select>().toHaveProperty("name");
    expectTypeOf<Select>().toHaveProperty("description");

    // name is NOT null (notNull: true)
    // description IS nullable
    // These verify that Drizzle's runtime inference preserves the notNull flag
    // even though our mapped return type uses `any`.
    type NameType = Select["name"];
    type DescType = Select["description"];

    // name should be Record<string, string> (the $type we set)
    expectTypeOf<NameType>().toEqualTypeOf<Record<string, string>>();
    // description should be Record<string, string> | null
    expectTypeOf<DescType>().toEqualTypeOf<Record<string, string> | null>();
  });

  it("createI18n jsonTranslations also carries types through pgTable", () => {
    const i18n = createI18n({
      defaultLocale: "en",
      locales: ["en", "ar"] as const,
    });

    const table = pgTable("test2", {
      id: serial("id").primaryKey(),
      ...i18n.jsonTranslations({
        title: { notNull: true },
        subtitle: {},
      }),
    });

    type Select = typeof table.$inferSelect;
    expectTypeOf<Select>().toHaveProperty("title");
    expectTypeOf<Select>().toHaveProperty("subtitle");
  });
});
