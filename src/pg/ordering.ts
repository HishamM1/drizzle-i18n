import type { SQL } from "drizzle-orm";
import { asc, desc, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { escapeSqlString } from "../core/utils.js";

/**
 * Generate an ORDER BY expression on a JSONB i18n column for a specific locale.
 * Extracts the locale value and sorts by it.
 *
 * @example
 * db.select().from(products).orderBy(orderByLocale(products.name, "en"));
 * db.select().from(products).orderBy(orderByLocale(products.name, "en", "desc"));
 */
export function orderByLocale(
  column: PgColumn,
  locale: string,
  direction: "asc" | "desc" = "asc",
): SQL {
  const key = escapeSqlString(locale);
  const extract = sql`${column}->>${sql.raw(`'${key}'`)}`;
  return direction === "desc" ? desc(extract) : asc(extract);
}
