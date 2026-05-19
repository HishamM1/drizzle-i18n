export interface TranslationTableOptions {
  /** Override the generated table name. Default: `${parentName}_translations` */
  tableName?: string;
  /** Override the FK column name. Default: `${singularize(parentName)}_id` */
  parentIdColumn?: string;
  /** Override the locale column name. Default: `"locale"` */
  localeColumn?: string;
  /** Override the locale column length (varchar). Default: `10` */
  localeLength?: number;
}

export type TranslationFieldValues<TColumnName extends string = string> = Partial<
  Record<TColumnName, unknown>
>;

export type LocaleTranslationMap<TColumnName extends string = string> = Record<
  string,
  TranslationFieldValues<TColumnName>
>;

export type TranslationRowData<TColumnName extends string = string> = Record<string, unknown> &
  TranslationFieldValues<TColumnName>;

export interface SetTranslationsData<TColumnName extends string = string>
  extends Record<string, unknown> {
  translations: LocaleTranslationMap<TColumnName>;
}

export interface InsertWithTranslationsData<TColumnName extends string = string> {
  values: Record<string, unknown>;
  translations: LocaleTranslationMap<TColumnName>;
}

/**
 * The result shape returned by translationTable().
 * Used as the i18nResult parameter across query and mutation helpers.
 */
export interface TranslationTableResult<
  TTable = unknown,
  TColumnName extends string = string,
  TFkColumn = unknown,
  TLocaleColumn = unknown,
> {
  table: TTable;
  translationsRelations: unknown;
  parentRelations: unknown;
  parentRelationConfig: (helpers: unknown) => Record<string, unknown>;
  translatableColumnNames: TColumnName[];
  fkColumn: TFkColumn;
  localeColumn: TLocaleColumn;
  /** The name of the locale column in the translations table. */
  localeColumnName: string;
}
