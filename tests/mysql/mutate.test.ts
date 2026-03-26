import { describe, expect, it } from "vitest";
import { setTranslations, updateLocale, upsertTranslation } from "../../src/mysql/mutate.js";

describe("mysql mutation helpers", () => {
  it("exports upsertTranslation", () => {
    expect(typeof upsertTranslation).toBe("function");
  });

  it("exports setTranslations", () => {
    expect(typeof setTranslations).toBe("function");
  });

  it("exports updateLocale", () => {
    expect(typeof updateLocale).toBe("function");
  });
});
