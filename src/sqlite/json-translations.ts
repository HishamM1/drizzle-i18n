import type { $Type, NotNull } from "drizzle-orm";
import type { SQLiteTextJsonBuilderInitial } from "drizzle-orm/sqlite-core";
import { text } from "drizzle-orm/sqlite-core";

type JsonTranslationsConfig = Record<string, { notNull?: boolean }>;

type JsonTyped<TName extends string> = $Type<
  SQLiteTextJsonBuilderInitial<TName>,
  Record<string, string>
>;

type JsonTranslationsResult<T extends JsonTranslationsConfig> = {
  [K in keyof T & string]: T[K] extends { notNull: true } ? NotNull<JsonTyped<K>> : JsonTyped<K>;
};

/**
 * Generate JSON-as-text columns for inline translations (SQLite).
 * Spread the result into a sqliteTable definition.
 *
 * Each field produces a column of type `text({ mode: "json" })`,
 * typed as `Record<string, string>` (locale -> translated value).
 *
 * SQLite has no native JSON column -- Drizzle stores JSON as text
 * and parses/serializes automatically when `mode: "json"` is set.
 *
 * @example
 * const products = sqliteTable("products", {
 *   id: integer("id").primaryKey({ autoIncrement: true }),
 *   ...jsonTranslations({ name: { notNull: true }, description: {} }),
 * });
 */
export function jsonTranslations<T extends JsonTranslationsConfig>(
  fields: T,
): JsonTranslationsResult<T> {
  const result: Record<string, any> = {};
  for (const name of Object.keys(fields)) {
    const config = fields[name];
    const col = text(name, { mode: "json" }).$type<Record<string, string>>();
    result[name] = config.notNull ? col.notNull() : col;
  }
  return result as JsonTranslationsResult<T>;
}
