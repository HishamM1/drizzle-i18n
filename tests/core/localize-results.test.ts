import { describe, expect, it } from "vitest";
import { localizeResults } from "../../src/core/localize-results.js";

const i18nResult = {
  translatableColumnNames: ["name", "description"],
};

describe("localizeResults", () => {
  it("flattens the matching locale", () => {
    const rows = [
      {
        id: 1,
        sku: "ABC",
        translations: [
          { locale: "en", name: "Phone", description: "A phone" },
          { locale: "ar", name: "هاتف", description: "هاتف ذكي" },
        ],
      },
    ];

    const result = localizeResults(rows, i18nResult, { locale: "ar" });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("هاتف");
    expect(result[0].description).toBe("هاتف ذكي");
    expect(result[0].id).toBe(1);
    expect(result[0].sku).toBe("ABC");
    expect(result[0]).not.toHaveProperty("translations");
  });

  it("falls back to default locale when requested locale is missing", () => {
    const rows = [
      {
        id: 1,
        translations: [{ locale: "en", name: "Phone", description: "A phone" }],
      },
    ];

    const result = localizeResults(rows, i18nResult, {
      locale: "fr",
      fallback: "en",
    });

    expect(result[0].name).toBe("Phone");
    expect(result[0].description).toBe("A phone");
  });

  it("returns null when neither locale nor fallback exists", () => {
    const rows = [
      {
        id: 1,
        translations: [{ locale: "en", name: "Phone", description: "A phone" }],
      },
    ];

    const result = localizeResults(rows, i18nResult, { locale: "fr" });

    expect(result[0].name).toBeNull();
    expect(result[0].description).toBeNull();
  });

  it("handles rows with empty translations array", () => {
    const rows = [{ id: 1, translations: [] }];

    const result = localizeResults(rows, i18nResult, { locale: "en" });

    expect(result[0].name).toBeNull();
    expect(result[0].description).toBeNull();
  });

  it("handles rows with no translations key", () => {
    const rows = [{ id: 1 }];

    const result = localizeResults(rows as any, i18nResult, { locale: "en" });

    expect(result[0].name).toBeNull();
  });

  it("supports custom relation key", () => {
    const rows = [
      {
        id: 1,
        i18n: [{ locale: "en", name: "Phone", description: "A phone" }],
      },
    ];

    const result = localizeResults(rows, i18nResult, {
      locale: "en",
      relationKey: "i18n",
    });

    expect(result[0].name).toBe("Phone");
    expect(result[0]).not.toHaveProperty("i18n");
  });

  it("prefers locale over fallback when both exist", () => {
    const rows = [
      {
        id: 1,
        translations: [
          { locale: "en", name: "Phone", description: "A phone" },
          { locale: "ar", name: "هاتف", description: "هاتف ذكي" },
        ],
      },
    ];

    const result = localizeResults(rows, i18nResult, {
      locale: "ar",
      fallback: "en",
    });

    expect(result[0].name).toBe("هاتف");
  });

  it("handles multiple rows", () => {
    const rows = [
      {
        id: 1,
        translations: [{ locale: "en", name: "Phone", description: "A phone" }],
      },
      {
        id: 2,
        translations: [{ locale: "en", name: "Tablet", description: "A tablet" }],
      },
    ];

    const result = localizeResults(rows, i18nResult, { locale: "en" });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Phone");
    expect(result[1].name).toBe("Tablet");
  });

  it("falls back per-field when locale row has null values", () => {
    const rows = [
      {
        id: 1,
        translations: [
          { locale: "en", name: "Phone", description: "A phone" },
          { locale: "ar", name: "هاتف", description: null },
        ],
      },
    ];

    const result = localizeResults(rows, i18nResult, {
      locale: "ar",
      fallback: "en",
    });

    // locale row exists but description is null — the ?? operator falls through
    // to the fallback row's value per-field. This is intentional: field-level fallback.
    expect(result[0].name).toBe("هاتف");
    expect(result[0].description).toBe("A phone");
  });
});
