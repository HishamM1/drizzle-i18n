import type { SQL } from "drizzle-orm";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { alias } from "drizzle-orm/pg-core";
import { escapeSqlString, findPrimaryKey } from "../core/utils.js";

/**
 * Extract a single locale value from a JSONB i18n column (PG).
 * Returns `SQL<string | null>` — null if the locale key doesn't exist.
 *
 * PG's ->> operator takes a text key, so hyphens in locale tags (e.g. "pt-BR") are safe.
 *
 * @example
 * db.select({ name: forLocale(products.name, "fr") }).from(products);
 */
export function forLocale(
  column: PgColumn,
  locale: string,
  opts?: { fallback?: string },
): SQL<string | null> {
  const key = escapeSqlString(locale);
  if (opts?.fallback) {
    const fbKey = escapeSqlString(opts.fallback);
    return sql<
      string | null
    >`COALESCE(${column}->>${sql.raw(`'${key}'`)}, ${column}->>${sql.raw(`'${fbKey}'`)})`;
  }
  return sql<string | null>`${column}->>${sql.raw(`'${key}'`)}`;
}

/**
 * Build a locale-aware SELECT query that LEFT JOINs the translation table.
 *
 * The locale predicate is in the ON clause (not WHERE) to preserve LEFT JOIN semantics —
 * parent rows without a matching translation still appear with null translatable fields.
 *
 * Returns a chainable Drizzle query -- call .where(), .limit(), etc. on the result.
 *
 * @example
 * const rows = await withTranslation(db, products, productI18n, { locale: "fr" });
 */
export function withTranslation(
  db: any,
  parent: PgTable,
  i18nResult: {
    table: PgTable;
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
