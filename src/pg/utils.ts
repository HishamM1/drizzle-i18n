import type { PgColumn } from "drizzle-orm/pg-core";
import { bigint, integer, text, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Build a PG FK column that matches the parent's PK column type.
 */
export function buildMatchingFkColumn(colName: string, pkCol: PgColumn) {
  const ct = (pkCol as any).columnType as string;

  switch (ct) {
    case "PgSerial":
    case "PgInteger":
      return integer(colName);
    case "PgBigSerial53":
    case "PgBigInt53":
      return bigint(colName, { mode: "number" });
    case "PgBigSerial64":
    case "PgBigInt64":
      return bigint(colName, { mode: "bigint" });
    case "PgText":
      return text(colName);
    case "PgVarchar":
      return varchar(colName);
    case "PgUUID":
      return uuid(colName);
    default:
      throw new Error(
        `drizzle-i18n: unsupported PK column type "${ct}" for FK generation. Use opts.parentIdColumn with a manual FK.`,
      );
  }
}
