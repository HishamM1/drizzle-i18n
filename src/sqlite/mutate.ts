import type { SQL } from "drizzle-orm";
import { getTableColumns, sql } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { escapeJsonKey, findPrimaryKey } from "../core/utils.js";

/**
 * Upsert a single locale row in a translation table (SQLite).
 * Uses ON CONFLICT (fk, locale) DO UPDATE SET ... (same syntax as PG).
 */
export async function upsertTranslation(
  db: any,
  i18nResult: {
    table: SQLiteTable;
    fkColumn: any;
    localeColumn: any;
    translatableColumnNames: string[];
  },
  data: Record<string, any>,
) {
  const { table, fkColumn, localeColumn, translatableColumnNames } = i18nResult;

  const tCols = getTableColumns(table);
  const setCols: Record<string, any> = {};
  for (const col of translatableColumnNames) {
    if (col in data) {
      setCols[col] = sql.raw(`excluded."${(tCols[col] as any).name}"`);
    }
  }

  return db
    .insert(table)
    .values(data)
    .onConflictDoUpdate({
      target: [fkColumn, localeColumn],
      set: setCols,
    });
}

/**
 * Bulk upsert translations for multiple locales at once (SQLite).
 */
export async function setTranslations(
  db: any,
  i18nResult: {
    table: SQLiteTable;
    fkColumn: any;
    localeColumn: any;
    translatableColumnNames: string[];
  },
  data: {
    [key: string]: any;
    translations: Record<string, Record<string, any>>;
  },
) {
  const { table, fkColumn, localeColumn, translatableColumnNames } = i18nResult;
  const fkKeyName = fkColumn.name;
  const localeKeyName = localeColumn.name;
  const tCols = getTableColumns(table);
  const fkValue = data[fkKeyName];

  const results = [];
  for (const [locale, fields] of Object.entries(data.translations)) {
    const colsInThisLocale = Object.keys(fields).filter((k) => translatableColumnNames.includes(k));
    if (colsInThisLocale.length === 0) continue;

    const setCols: Record<string, any> = {};
    for (const col of colsInThisLocale) {
      setCols[col] = sql.raw(`excluded."${(tCols[col] as any).name}"`);
    }

    const row = {
      [fkKeyName]: fkValue,
      [localeKeyName]: locale,
      ...fields,
    };

    results.push(
      db
        .insert(table)
        .values(row)
        .onConflictDoUpdate({
          target: [fkColumn, localeColumn],
          set: setCols,
        }),
    );
  }

  return Promise.all(results);
}

/**
 * Update a single locale value within a JSON-as-text i18n column (SQLite).
 * Uses json_set with COALESCE for NULL handling.
 */
export async function updateLocale(
  db: any,
  table: SQLiteTable,
  column: SQLiteColumn,
  opts: {
    where: SQL;
    locale: string;
    value: string;
  },
) {
  const path = `$."${escapeJsonKey(opts.locale)}"`;

  return db
    .update(table)
    .set({
      [column.name]: sql`json_set(COALESCE(${column}, '{}'), ${sql.raw(`'${path}'`)}, ${opts.value})`,
    })
    .where(opts.where);
}

/**
 * Insert a parent row and its translations in one call (SQLite).
 * Wrapped in a transaction — if translation insert fails, the parent insert is rolled back.
 * Works with both sync (better-sqlite3) and async (libsql/turso) drivers.
 *
 * @example
 * await insertWithTranslations(db, products, productI18n, {
 *   values: { sku: "ABC", price: 999 },
 *   translations: {
 *     en: { name: "Phone", description: "A phone" },
 *     ar: { name: "هاتف", description: "هاتف ذكي" },
 *   },
 * });
 */
export function insertWithTranslations(
  db: any,
  parent: SQLiteTable,
  i18nResult: {
    table: SQLiteTable;
    fkColumn: any;
    localeColumn: any;
    translatableColumnNames: string[];
  },
  data: {
    values: Record<string, any>;
    translations: Record<string, Record<string, any>>;
  },
) {
  const parentCols = getTableColumns(parent);
  const pk = findPrimaryKey(parentCols);
  const pkKey = pk.key;
  const fkKeyName = i18nResult.fkColumn.name;
  const localeKeyName = i18nResult.localeColumn.name;
  const allowedCols = new Set(i18nResult.translatableColumnNames);

  function buildTranslationRows(pkValue: any) {
    return Object.entries(data.translations).map(([locale, fields]) => {
      const filtered: Record<string, any> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (allowedCols.has(k)) filtered[k] = v;
      }
      return {
        [fkKeyName]: pkValue,
        [localeKeyName]: locale,
        ...filtered,
      };
    });
  }

  return db.transaction((tx: any) => {
    const insertResult = tx
      .insert(parent)
      .values(data.values)
      .returning({ pk: (parent as any)[pkKey] });

    if (insertResult && typeof insertResult.then === "function") {
      return insertResult.then((rows: any[]) => {
        const pkValue = rows[0].pk;
        const translationRows = buildTranslationRows(pkValue);
        if (translationRows.length > 0) {
          return tx
            .insert(i18nResult.table)
            .values(translationRows)
            .then(() => ({ ...data.values, [pkKey]: pkValue }));
        }
        return { ...data.values, [pkKey]: pkValue };
      });
    }

    const inserted = insertResult[0];
    const pkValue = inserted.pk;
    const translationRows = buildTranslationRows(pkValue);
    if (translationRows.length > 0) {
      tx.insert(i18nResult.table).values(translationRows).run();
    }
    return { ...data.values, [pkKey]: pkValue };
  });
}
