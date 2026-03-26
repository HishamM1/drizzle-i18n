/**
 * Post-process relational query results to flatten translations.
 *
 * Takes the output of a Drizzle relational query that includes `with: { translations: true }`
 * and flattens the matching locale's translatable fields onto each parent row.
 *
 * The `translations` array is removed from the output.
 *
 * @example
 * const rows = await db.query.products.findMany({ with: { translations: true } });
 * const localized = localizeResults(rows, productI18n, { locale: "fr", fallback: "en" });
 */
export function localizeResults<
  TRow extends Record<string, any>,
  TRelationKey extends string = "translations",
  TColNames extends string = string,
>(
  rows: TRow[],
  i18nResult: {
    translatableColumnNames: TColNames[];
    localeColumnName?: string;
  },
  opts: {
    locale: string;
    fallback?: string;
    relationKey?: TRelationKey;
  },
): Array<
  Omit<TRow, TRelationKey> & {
    [K in TColNames]: TRow[TRelationKey] extends Array<infer TTransRow>
      ? K extends keyof TTransRow
        ? TTransRow[K] | null
        : any | null
      : any | null;
  }
> {
  const relationKey = (opts.relationKey ?? "translations") as TRelationKey;
  const localeField = i18nResult.localeColumnName ?? "locale";
  const { locale, fallback } = opts;
  const colNames = i18nResult.translatableColumnNames;

  return rows.map((row) => {
    const translations: Record<string, any>[] = row[relationKey] ?? [];

    const localeRow = translations.find((t) => t[localeField] === locale);
    const fallbackRow = fallback
      ? translations.find((t) => t[localeField] === fallback)
      : undefined;

    const { [relationKey]: _, ...rest } = row;
    const result: Record<string, any> = { ...rest };

    for (const col of colNames) {
      result[col] = localeRow?.[col] ?? fallbackRow?.[col] ?? null;
    }

    return result as any;
  });
}
