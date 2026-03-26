import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { integer, text } from "drizzle-orm/sqlite-core";

/**
 * Build a SQLite FK column that matches the parent's PK column type.
 * SQLite only has integer and text as meaningful column types.
 */
export function buildMatchingFkColumn(colName: string, pkCol: SQLiteColumn) {
  const ct = (pkCol as any).columnType as string;

  switch (ct) {
    case "SQLiteInteger":
      return integer(colName);
    case "SQLiteText":
      return text(colName);
    default:
      throw new Error(
        `drizzle-i18n: unsupported PK column type "${ct}" for FK generation. Use opts.parentIdColumn with a manual FK.`,
      );
  }
}
