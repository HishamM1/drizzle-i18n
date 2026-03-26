import type { $Type, NotNull } from "drizzle-orm";
import type { PgJsonbBuilderInitial } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";

type JsonTranslationsConfig = Record<string, { notNull?: boolean }>;

// Compute the concrete builder type for each column:
// - Always applies $type<Record<string, string>>
// - Conditionally applies NotNull based on config
type JsonbTyped<TName extends string> = $Type<PgJsonbBuilderInitial<TName>, Record<string, string>>;

type JsonTranslationsResult<T extends JsonTranslationsConfig> = {
  [K in keyof T & string]: T[K] extends { notNull: true } ? NotNull<JsonbTyped<K>> : JsonbTyped<K>;
};

/**
 * Generate JSONB columns for inline translations (PG).
 * Spread the result into a pgTable definition.
 *
 * Each field produces a column of type `jsonb`,
 * typed as `Record<string, string>` (locale -> translated value).
 *
 * @example
 * const products = pgTable("products", {
 *   id: serial("id").primaryKey(),
 *   ...jsonTranslations({ name: { notNull: true }, description: {} }),
 * });
 */
export function jsonTranslations<T extends JsonTranslationsConfig>(
  fields: T,
): JsonTranslationsResult<T> {
  const result: Record<string, any> = {};
  for (const name of Object.keys(fields)) {
    const config = fields[name];
    const col = jsonb(name).$type<Record<string, string>>();
    result[name] = config.notNull ? col.notNull() : col;
  }
  return result as JsonTranslationsResult<T>;
}
