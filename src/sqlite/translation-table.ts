import { getTableColumns, getTableName, relations } from "drizzle-orm";
import type { SQLiteColumnBuilderBase, SQLiteTable } from "drizzle-orm/sqlite-core";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import type { TranslationTableOptions } from "../core/types.js";
import { findPrimaryKey, singularize } from "../core/utils.js";
import { buildMatchingFkColumn } from "./utils.js";

/**
 * Create a translation table and relations for a parent SQLite table.
 * Returns the table, relations, and metadata needed by query/mutation helpers.
 *
 * @example
 * const productI18n = translationTable(products, {
 *   name: text("name").notNull(),
 *   description: text("description"),
 * });
 */
export function translationTable<
  TParent extends SQLiteTable,
  TColumns extends Record<string, SQLiteColumnBuilderBase>,
>(parent: TParent, columns: TColumns, opts?: TranslationTableOptions) {
  const parentName = getTableName(parent);
  const parentCols = getTableColumns(parent);
  const pk = findPrimaryKey(parentCols);

  const tableName = opts?.tableName ?? `${parentName}_translations`;
  const fkColName = opts?.parentIdColumn ?? `${singularize(parentName)}_id`;
  const localeColName = opts?.localeColumn ?? "locale";

  const fkBuilder = buildMatchingFkColumn(fkColName, pk.column);
  const pkKey = pk.key;

  const table = sqliteTable(
    tableName,
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
      [fkColName]: fkBuilder.notNull().references(() => (parent as any)[pkKey]),
      [localeColName]: text(localeColName).notNull(),
      ...columns,
    },
    (t) => [
      unique(`${tableName}_${fkColName}_${localeColName}_unique`).on(
        (t as any)[fkColName],
        (t as any)[localeColName],
      ),
    ],
  );

  const translationsRelations = relations(table, ({ one }) => ({
    parent: one(parent, {
      fields: [(table as any)[fkColName]],
      references: [(parent as any)[pkKey]],
    }),
  }));

  const parentRelations = relations(parent, ({ many }) => ({
    translations: many(table),
  }));

  const parentRelationConfig = ({ many }: any) => ({
    translations: many(table),
  });

  return {
    table,
    translationsRelations,
    parentRelations,
    parentRelationConfig,
    translatableColumnNames: Object.keys(columns) as Array<keyof TColumns & string>,
    fkColumn: (table as any)[fkColName] as any,
    localeColumn: (table as any)[localeColName] as any,
    localeColumnName: localeColName,
  };
}
