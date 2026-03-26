import type { SQL } from "drizzle-orm";
import { getTableColumns, sql } from "drizzle-orm";
import type { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { escapeJsonKey, findPrimaryKey } from "../core/utils.js";

/**
 * Upsert a single locale row in a translation table (MySQL).
 * Uses ON DUPLICATE KEY UPDATE ... for all translatable columns.
 */
export async function upsertTranslation(
  db: any,
  i18nResult: {
    table: MySqlTable;
    fkColumn: any;
    localeColumn: any;
    translatableColumnNames: string[];
  },
  data: Record<string, any>,
) {
  const { table, translatableColumnNames } = i18nResult;

  const tCols = getTableColumns(table);
  const setCols: Record<string, any> = {};
  for (const col of translatableColumnNames) {
    if (col in data) {
      setCols[col] = sql`values(${sql.raw(`\`${(tCols[col] as any).name}\``)})`;
    }
  }

  return db.insert(table).values(data).onDuplicateKeyUpdate({ set: setCols });
}

/**
 * Bulk upsert translations for multiple locales at once (MySQL).
 */
export async function setTranslations(
  db: any,
  i18nResult: {
    table: MySqlTable;
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
      setCols[col] = sql`values(${sql.raw(`\`${(tCols[col] as any).name}\``)})`;
    }

    const row = {
      [fkKeyName]: fkValue,
      [localeKeyName]: locale,
      ...fields,
    };

    results.push(db.insert(table).values(row).onDuplicateKeyUpdate({ set: setCols }));
  }

  return Promise.all(results);
}

/**
 * Update a single locale value within a JSON i18n column (MySQL).
 * Uses JSON_SET with COALESCE for NULL handling.
 */
export async function updateLocale(
  db: any,
  table: MySqlTable,
  column: MySqlColumn,
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
      [column.name]: sql`JSON_SET(COALESCE(${column}, JSON_OBJECT()), ${sql.raw(`'${path}'`)}, ${opts.value})`,
    })
    .where(opts.where);
}

/**
 * Insert a parent row and its translations in one call (MySQL).
 * Wrapped in a transaction — if translation insert fails, the parent insert is rolled back.
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
export async function insertWithTranslations(
  db: any,
  parent: MySqlTable,
  i18nResult: {
    table: MySqlTable;
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

  return db.transaction(async (tx: any) => {
    let pkValue: any;
    if (data.values[pkKey] != null) {
      await tx.insert(parent).values(data.values);
      pkValue = data.values[pkKey];
    } else {
      const [inserted] = await tx.insert(parent).values(data.values).$returningId();
      pkValue = inserted[pkKey];
    }

    const rows = Object.entries(data.translations).map(([locale, fields]) => {
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

    if (rows.length > 0) {
      await tx.insert(i18nResult.table).values(rows);
    }

    return { ...data.values, [pkKey]: pkValue };
  });
}
