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

/**
 * The result shape returned by translationTable().
 * Used as the i18nResult parameter across query and mutation helpers.
 */
export interface TranslationTableResult<TTable = any> {
  table: TTable;
  translationsRelations: any;
  parentRelations: any;
  parentRelationConfig: (helpers: any) => Record<string, any>;
  translatableColumnNames: string[];
  fkColumn: any;
  localeColumn: any;
  /** The name of the locale column in the translations table. */
  localeColumnName: string;
}
