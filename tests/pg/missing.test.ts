import { describe, expect, it } from "vitest";
import { missingTranslations } from "../../src/pg/missing.js";

describe("pg missingTranslations", () => {
  it("exports correctly", () => {
    expect(typeof missingTranslations).toBe("function");
  });
});
