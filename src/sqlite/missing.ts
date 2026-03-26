import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { alias } from "drizzle-orm/sqlite-core";
import { findPrimaryKey } from "../core/utils.js";

/**
 * Find parent entities missing a translation for a given locale (SQLite).
 *
 * @example
 * const missing = await missingTranslations(db, products, productI18n, "ar");
 */
export function missingTranslations(
  db: any,
  parent: SQLiteTable,
  i18nResult: {
    table: SQLiteTable;
    fkColumn: any;
    localeColumn: any;
  },
  locale: string,
) {
  const parentCols = getTableColumns(parent);
  const pk = findPrimaryKey(parentCols);
  const parentPkCol = (parent as any)[pk.key];
  const fkCol = i18nResult.fkColumn;
  const localeCol = i18nResult.localeColumn;

  const ta = alias(i18nResult.table, "t_miss");

  return db
    .select(getTableColumns(parent))
    .from(parent)
    .leftJoin(
      ta,
      and(eq((ta as any)[fkCol.name], parentPkCol), eq((ta as any)[localeCol.name], locale)),
    )
    .where(isNull((ta as any)[localeCol.name]));
}
