import type { SQL } from "drizzle-orm";
import { asc, desc, sql } from "drizzle-orm";
import type { MySqlColumn } from "drizzle-orm/mysql-core";
import { escapeJsonKey } from "../core/utils.js";

/**
 * Generate an ORDER BY expression on a JSON i18n column for a specific locale (MySQL).
 *
 * @example
 * db.select().from(products).orderBy(orderByLocale(products.name, "en"));
 */
export function orderByLocale(
  column: MySqlColumn,
  locale: string,
  direction: "asc" | "desc" = "asc",
): SQL {
  const path = `$."${escapeJsonKey(locale)}"`;
  const extract = sql`JSON_UNQUOTE(JSON_EXTRACT(${column}, ${sql.raw(`'${path}'`)}))`;
  return direction === "desc" ? desc(extract) : asc(extract);
}
