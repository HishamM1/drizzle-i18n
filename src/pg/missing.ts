import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { alias } from "drizzle-orm/pg-core";
import { findPrimaryKey } from "../core/utils.js";

/**
 * Find parent entities missing a translation for a given locale.
 * Uses LEFT JOIN + IS NULL — returns parent rows with no matching translation row.
 *
 * @example
 * const missing = await missingTranslations(db, products, productI18n, "ar");
 */
export function missingTranslations(
  db: any,
  parent: PgTable,
  i18nResult: {
    table: PgTable;
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
