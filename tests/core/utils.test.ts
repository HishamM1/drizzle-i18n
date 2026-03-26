import { getTableColumns } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { findPrimaryKey, singularize } from "../../src/core/utils.js";

describe("singularize", () => {
  it("strips trailing s", () => {
    expect(singularize("products")).toBe("product");
    expect(singularize("users")).toBe("user");
    expect(singularize("posts")).toBe("post");
  });

  it("handles -ies → -y", () => {
    expect(singularize("categories")).toBe("category");
    expect(singularize("countries")).toBe("country");
  });

  it("handles -sses → -ss", () => {
    expect(singularize("classes")).toBe("class");
  });

  it("handles -shes → -sh", () => {
    expect(singularize("dishes")).toBe("dish");
  });

  it("handles -ches → -ch", () => {
    expect(singularize("watches")).toBe("watch");
  });

  it("handles -xes → -x", () => {
    expect(singularize("boxes")).toBe("box");
  });

  it("handles -zes → -z", () => {
    expect(singularize("quizzes")).toBe("quizz");
    // not perfect for "quizzes" but acceptable — user can override via opts
  });

  it("preserves words ending in -ss", () => {
    expect(singularize("grass")).toBe("grass");
    expect(singularize("boss")).toBe("boss");
  });

  it("preserves words ending in -us", () => {
    expect(singularize("status")).toBe("status");
    expect(singularize("campus")).toBe("campus");
  });

  it("preserves words ending in -is", () => {
    expect(singularize("analysis")).toBe("analysis");
  });

  it("preserves already singular words", () => {
    expect(singularize("user")).toBe("user");
    expect(singularize("data")).toBe("data");
  });
});

describe("findPrimaryKey", () => {
  it("finds a single PK column", () => {
    const table = pgTable("test", {
      id: serial("id").primaryKey(),
      name: text("name"),
    });
    const cols = getTableColumns(table);
    const pk = findPrimaryKey(cols);
    expect(pk.key).toBe("id");
    expect(pk.column).toBeDefined();
  });

  it("throws if no PK column exists", () => {
    const table = pgTable("test", {
      name: text("name"),
      value: integer("value"),
    });
    const cols = getTableColumns(table);
    expect(() => findPrimaryKey(cols)).toThrow("must have a primary key");
  });
});
