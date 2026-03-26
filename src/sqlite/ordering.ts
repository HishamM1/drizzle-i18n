import type { SQL } from "drizzle-orm";
import { asc, desc, sql } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { escapeJsonKey } from "../core/utils.js";

/**
 * Generate an ORDER BY expression on a JSON-as-text i18n column for a specific locale (SQLite).
 *
 * @example
 * db.select().from(products).orderBy(orderByLocale(products.name, "en"));
 */
export function orderByLocale(
  column: SQLiteColumn,
  locale: string,
  direction: "asc" | "desc" = "asc",
): SQL {
  const path = `$."${escapeJsonKey(locale)}"`;
  const extract = sql`json_extract(${column}, ${sql.raw(`'${path}'`)})`;
  return direction === "desc" ? desc(extract) : asc(extract);
}
