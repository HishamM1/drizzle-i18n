import { getTableColumns, getTableName, relations } from "drizzle-orm";
import type { PgColumnBuilderBase, PgTable } from "drizzle-orm/pg-core";
import { pgTable, serial, unique, varchar } from "drizzle-orm/pg-core";
import type { TranslationTableOptions } from "../core/types.js";
import { findPrimaryKey, singularize } from "../core/utils.js";
import { buildMatchingFkColumn } from "./utils.js";

/**
 * Create a translation table and relations for a parent PG table.
 * Returns the table, relations, and metadata needed by query/mutation helpers.
 *
 * @example
 * const productI18n = translationTable(products, {
 *   name: varchar("name", { length: 255 }).notNull(),
 *   description: text("description"),
 * });
 */
export function translationTable<
  TParent extends PgTable,
  TColumns extends Record<string, PgColumnBuilderBase>,
>(parent: TParent, columns: TColumns, opts?: TranslationTableOptions) {
  const parentName = getTableName(parent);
  const parentCols = getTableColumns(parent);
  const pk = findPrimaryKey(parentCols);

  const tableName = opts?.tableName ?? `${parentName}_translations`;
  const fkColName = opts?.parentIdColumn ?? `${singularize(parentName)}_id`;
  const localeColName = opts?.localeColumn ?? "locale";
  const localeLength = opts?.localeLength ?? 10;

  const fkBuilder = buildMatchingFkColumn(fkColName, pk.column);
  const pkKey = pk.key;

  const table = pgTable(
    tableName,
    {
      id: serial("id").primaryKey(),
      [fkColName]: fkBuilder.notNull().references(() => (parent as any)[pkKey]),
      [localeColName]: varchar(localeColName, { length: localeLength }).notNull(),
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
    fkColumn: (table as any)[fkColName] as typeof table extends Record<string, any> ? any : never,
    localeColumn: (table as any)[localeColName] as any,
    localeColumnName: localeColName,
  };
}
