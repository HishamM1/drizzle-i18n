/**
 * Naive English singularization for FK name derivation.
 * Handles common plural patterns. For irregular plurals (people, children, data),
 * use `opts.parentIdColumn` to set the FK name explicitly.
 */
export function singularize(name: string): string {
  if (name.endsWith("ies")) return `${name.slice(0, -3)}y`;
  if (name.endsWith("sses")) return name.slice(0, -2);
  if (name.endsWith("shes")) return name.slice(0, -2);
  if (name.endsWith("ches")) return name.slice(0, -2);
  if (name.endsWith("xes")) return name.slice(0, -2);
  if (name.endsWith("zes")) return name.slice(0, -2);
  if (name.endsWith("s") && !name.endsWith("ss") && !name.endsWith("us") && !name.endsWith("is")) {
    return name.slice(0, -1);
  }
  return name;
}

/**
 * Find the single primary key column from a table's columns map.
 * Throws if the table has zero or multiple PK columns (composite PKs not supported in Phase 1).
 */
export function findPrimaryKey(columns: Record<string, any>): { key: string; column: any } {
  const pks = Object.entries(columns).filter(([, col]) => col.primary === true);
  if (pks.length === 0) {
    throw new Error("drizzle-i18n: parent table must have a primary key column");
  }
  if (pks.length > 1) {
    throw new Error(
      "drizzle-i18n: composite primary keys are not supported yet. Use opts.parentIdColumn with a manual FK setup.",
    );
  }
  return { key: pks[0][0], column: pks[0][1] };
}

/**
 * Escape a string for safe use in SQL string literals.
 * Replaces single quotes with doubled single quotes.
 */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Escape a key for use in a JSON path inside a double-quoted segment.
 * Used in MySQL/SQLite: $."key" — must escape \ and " within the key.
 * The result is placed inside double quotes in a SQL string literal,
 * so we also escape single quotes for the outer SQL layer.
 */
export function escapeJsonKey(key: string): string {
  return key.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "''");
}

/**
 * Escape a key for use in a PostgreSQL text[] array literal: '{key}'.
 * PG array literals use \ as escape and " to quote elements with special chars.
 * We always double-quote the element for safety.
 */
export function escapePgArrayKey(key: string): string {
  const escaped = key.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "''");
  return `"${escaped}"`;
}
