import type { MySqlColumn } from "drizzle-orm/mysql-core";
import { bigint, int, text, varchar } from "drizzle-orm/mysql-core";

/**
 * Build a MySQL FK column that matches the parent's PK column type.
 * Preserves unsigned flag for int/bigint and length for varchar.
 */
export function buildMatchingFkColumn(colName: string, pkCol: MySqlColumn) {
  const ct = (pkCol as any).columnType as string;
  const config = (pkCol as any).config as Record<string, any> | undefined;

  switch (ct) {
    case "MySqlSerial":
      return bigint(colName, { mode: "number", unsigned: true } as any);
    case "MySqlInt": {
      const unsigned = config?.unsigned ?? false;
      return int(colName, unsigned ? { unsigned: true } : undefined);
    }
    case "MySqlBigInt53": {
      const unsigned = config?.unsigned ?? false;
      return bigint(colName, { mode: "number", ...(unsigned ? { unsigned: true } : {}) } as any);
    }
    case "MySqlBigInt64": {
      const unsigned = config?.unsigned ?? false;
      return bigint(colName, { mode: "bigint", ...(unsigned ? { unsigned: true } : {}) } as any);
    }
    case "MySqlVarChar": {
      const length = (pkCol as any).length ?? config?.length ?? 255;
      return varchar(colName, { length });
    }
    case "MySqlText":
      return text(colName);
    default:
      throw new Error(
        `drizzle-i18n: unsupported PK column type "${ct}" for FK generation. Use opts.parentIdColumn with a manual FK.`,
      );
  }
}
