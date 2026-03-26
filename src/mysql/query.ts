import type { SQL } from "drizzle-orm";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import type { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { alias } from "drizzle-orm/mysql-core";
import { escapeJsonKey, findPrimaryKey } from "../core/utils.js";

/**
 * Extract a single locale value from a JSON i18n column (MySQL).
 * Uses JSON_UNQUOTE(JSON_EXTRACT(...)) with bracket-quoted paths for locale tags with special chars.
 *
 * @example
 * db.select({ name: forLocale(products.name, "fr") }).from(products);
 */
export function forLocale(
  column: MySqlColumn,
  locale: string,
  opts?: { fallback?: string },
): SQL<string | null> {
  const path = `$."${escapeJsonKey(locale)}"`;
  const extract = sql`JSON_UNQUOTE(JSON_EXTRACT(${column}, ${sql.raw(`'${path}'`)}))`;
  if (opts?.fallback) {
    const fbPath = `$."${escapeJsonKey(opts.fallback)}"`;
    const fbExtract = sql`JSON_UNQUOTE(JSON_EXTRACT(${column}, ${sql.raw(`'${fbPath}'`)}))`;
    return sql<string | null>`COALESCE(${extract}, ${fbExtract})`;
  }
  return sql<string | null>`${extract}`;
}

/**
 * Build a locale-aware SELECT query that LEFT JOINs the translation table (MySQL).
 * Parent rows without a matching translation still appear with null translatable fields.
 *
 * @example
 * const rows = await withTranslation(db, products, productI18n, { locale: "fr" });
 */
export function withTranslation(
  db: any,
  parent: MySqlTable,
  i18nResult: {
    table: MySqlTable;
    fkColumn: any;
    localeColumn: any;
    translatableColumnNames: string[];
  },
  opts: { locale: string; fallback?: string },
) {
  const t = i18nResult.table;
  const parentCols = getTableColumns(parent);
  const pk = findPrimaryKey(parentCols);
  const parentPkCol = (parent as any)[pk.key];
  const fkCol = i18nResult.fkColumn;
  const localeCol = i18nResult.localeColumn;

  if (opts.fallback) {
    const t1 = alias(t, "t_locale");
    const t2 = alias(t, "t_fallback");

    const selectShape: Record<string, any> = { ...getTableColumns(parent) };
    for (const colName of i18nResult.translatableColumnNames) {
      selectShape[colName] = sql`COALESCE(${(t1 as any)[colName]}, ${(t2 as any)[colName]})`.as(
        colName,
      );
    }

    return db
      .select(selectShape)
      .from(parent)
      .leftJoin(
        t1,
        and(eq((t1 as any)[fkCol.name], parentPkCol), eq((t1 as any)[localeCol.name], opts.locale)),
      )
      .leftJoin(
        t2,
        and(
          eq((t2 as any)[fkCol.name], parentPkCol),
          eq((t2 as any)[localeCol.name], opts.fallback),
        ),
      );
  }

  const translatableCols: Record<string, any> = {};
  const tCols = getTableColumns(t);
  for (const colName of i18nResult.translatableColumnNames) {
    translatableCols[colName] = tCols[colName];
  }

  return db
    .select({ ...getTableColumns(parent), ...translatableCols })
    .from(parent)
    .leftJoin(t, and(eq(fkCol, parentPkCol), eq(localeCol, opts.locale)));
}
