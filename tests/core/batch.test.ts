import { describe, expect, it } from "vitest";
import { exportTranslations, importTranslations } from "../../src/core/batch.js";

const i18nResult = {
  translatableColumnNames: ["name", "description"],
};

describe("exportTranslations", () => {
  it("groups rows by parent FK and locale", () => {
    const rows = [
      { product_id: 1, locale: "en", name: "Phone", description: "A phone" },
      { product_id: 1, locale: "ar", name: "هاتف", description: "هاتف ذكي" },
      { product_id: 2, locale: "en", name: "Tablet", description: "A tablet" },
    ];

    const result = exportTranslations(rows, i18nResult, "product_id");

    expect(result[1]).toEqual({
      en: { name: "Phone", description: "A phone" },
      ar: { name: "هاتف", description: "هاتف ذكي" },
    });
    expect(result[2]).toEqual({
      en: { name: "Tablet", description: "A tablet" },
    });
  });

  it("handles empty input", () => {
    expect(exportTranslations([], i18nResult, "product_id")).toEqual({});
  });

  it("sets null for missing translatable fields", () => {
    const rows = [{ product_id: 1, locale: "en", name: "Phone" }];

    const result = exportTranslations(rows, i18nResult, "product_id");
    expect(result[1].en.description).toBeNull();
  });
});

describe("importTranslations", () => {
  it("converts grouped format to flat rows", () => {
    const data = {
      1: {
        en: { name: "Phone", description: "A phone" },
        ar: { name: "هاتف", description: "هاتف ذكي" },
      },
    };

    const rows = importTranslations(data, "product_id");

    expect(rows).toHaveLength(2);
    // Object.entries always yields string keys — IDs come back as strings
    expect(rows).toContainEqual({
      product_id: "1",
      locale: "en",
      name: "Phone",
      description: "A phone",
    });
    expect(rows).toContainEqual({
      product_id: "1",
      locale: "ar",
      name: "هاتف",
      description: "هاتف ذكي",
    });
  });

  it("handles string parent IDs", () => {
    const data = {
      "abc-uuid": {
        en: { name: "Item" },
      },
    };

    const rows = importTranslations(data, "item_id");
    expect(rows[0].item_id).toBe("abc-uuid");
  });

  it("preserves parent IDs as strings (caller handles type)", () => {
    const data = {
      42: { en: { name: "Item" } },
    };

    const rows = importTranslations(data, "product_id");
    // Object keys are always strings — caller must cast if needed
    expect(rows[0].product_id).toBe("42");
  });

  it("handles empty input", () => {
    expect(importTranslations({}, "product_id")).toEqual([]);
  });

  it("round-trips with exportTranslations", () => {
    const original = [
      { product_id: 1, locale: "en", name: "Phone", description: "A phone" },
      { product_id: 1, locale: "ar", name: "هاتف", description: "هاتف ذكي" },
    ];

    const exported = exportTranslations(original, i18nResult, "product_id");
    const reimported = importTranslations(exported, "product_id");

    expect(reimported).toHaveLength(2);
    for (const row of reimported) {
      const match = original.find(
        (o) => String(o.product_id) === String(row.product_id) && o.locale === row.locale,
      );
      expect(match).toBeDefined();
      expect(row.name).toBe(match!.name);
      expect(row.description).toBe(match!.description);
    }
  });
});
