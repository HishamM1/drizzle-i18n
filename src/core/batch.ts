/**
 * Convert flat translation rows into a locale-keyed export format.
 *
 * Takes the output of `db.select().from(translationsTable)` and groups it
 * by parent FK, then by locale.
 *
 * @example
 * const rows = await db.select().from(productTranslations);
 * const exported = exportTranslations(rows, productI18n, "product_id");
 * // => { 1: { en: { name: "Phone" }, ar: { name: "هاتف" } }, 2: { ... } }
 */
export function exportTranslations<TRow extends Record<string, any>>(
  rows: TRow[],
  i18nResult: { translatableColumnNames: string[] },
  fkKey: string,
  localeKey: string = "locale",
): Record<string | number, Record<string, Record<string, any>>> {
  const result: Record<string | number, Record<string, Record<string, any>>> = {};
  const colNames = i18nResult.translatableColumnNames;

  for (const row of rows) {
    const parentId = row[fkKey];
    const locale = row[localeKey];
    if (parentId == null || locale == null) continue;

    if (!result[parentId]) result[parentId] = {};

    const fields: Record<string, any> = {};
    for (const col of colNames) {
      fields[col] = row[col] ?? null;
    }
    result[parentId][locale] = fields;
  }

  return result;
}

/**
 * Convert a locale-keyed import format into flat rows for bulk insert.
 *
 * The inverse of `exportTranslations()` — takes the grouped format and produces
 * an array of rows ready for `db.insert(translationsTable).values(rows)`.
 *
 * @example
 * const data = { 1: { en: { name: "Phone" }, ar: { name: "هاتف" } } };
 * const rows = importTranslations(data, "product_id");
 * await db.insert(productTranslations.table).values(rows);
 */
export function importTranslations(
  data: Record<string | number, Record<string, Record<string, any>>>,
  fkKey: string,
  localeKey: string = "locale",
): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  for (const [parentId, locales] of Object.entries(data)) {
    for (const [locale, fields] of Object.entries(locales)) {
      rows.push({
        [fkKey]: parentId,
        [localeKey]: locale,
        ...fields,
      });
    }
  }

  return rows;
}
