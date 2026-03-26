import type { $Type, NotNull } from "drizzle-orm";
import type { MySqlJsonBuilderInitial } from "drizzle-orm/mysql-core";
import { json } from "drizzle-orm/mysql-core";

type JsonTranslationsConfig = Record<string, { notNull?: boolean }>;

type JsonTyped<TName extends string> = $Type<
  MySqlJsonBuilderInitial<TName>,
  Record<string, string>
>;

type JsonTranslationsResult<T extends JsonTranslationsConfig> = {
  [K in keyof T & string]: T[K] extends { notNull: true } ? NotNull<JsonTyped<K>> : JsonTyped<K>;
};

/**
 * Generate JSON columns for inline translations (MySQL).
 * Spread the result into a mysqlTable definition.
 *
 * Each field produces a column of type `json`,
 * typed as `Record<string, string>` (locale -> translated value).
 *
 * @example
 * const products = mysqlTable("products", {
 *   id: int("id").autoincrement().primaryKey(),
 *   ...jsonTranslations({ name: { notNull: true }, description: {} }),
 * });
 */
export function jsonTranslations<T extends JsonTranslationsConfig>(
  fields: T,
): JsonTranslationsResult<T> {
  const result: Record<string, any> = {};
  for (const name of Object.keys(fields)) {
    const config = fields[name];
    const col = json(name).$type<Record<string, string>>();
    result[name] = config.notNull ? col.notNull() : col;
  }
  return result as JsonTranslationsResult<T>;
}
