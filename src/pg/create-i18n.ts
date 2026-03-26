import type { $Type, NotNull, SQL } from "drizzle-orm";
import type {
  PgColumn,
  PgColumnBuilderBase,
  PgJsonbBuilderInitial,
  PgTable,
} from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";
import type { I18nConfig, LocaleMap } from "../core/config.js";
import { validateLocale } from "../core/config.js";
import type { TranslationTableOptions, TranslationTableResult } from "../core/types.js";
import {
  insertWithTranslations as rawInsertWithTranslations,
  setTranslations as rawSetTranslations,
  updateLocale as rawUpdateLocale,
  upsertTranslation as rawUpsertTranslation,
} from "./mutate.js";
import { forLocale as rawForLocale, withTranslation as rawWithTranslation } from "./query.js";
import { translationTable } from "./translation-table.js";

/**
 * Create a locale-scoped i18n helper set for PostgreSQL.
 *
 * When `locales` is passed as `const`, all helpers gain strict locale typing.
 * When `strict: true`, runtime locale validation is enabled.
 */
export function createI18n<
  const TLocales extends readonly string[],
  TDefault extends TLocales[number],
>(config: I18nConfig<TLocales, TDefault>) {
  const { locales, strict } = config;

  function check(locale: string, ctx: string) {
    if (strict) validateLocale(locale, locales, ctx);
  }

  return {
    config,

    translationTable<TParent extends PgTable, TColumns extends Record<string, PgColumnBuilderBase>>(
      parent: TParent,
      columns: TColumns,
      opts?: TranslationTableOptions,
    ) {
      return translationTable(parent, columns, opts);
    },

    /**
     * Generate JSONB i18n columns with locale-narrowed typing.
     * Each column is typed as `LocaleMap<TLocales, TDefault>` instead of `Record<string, string>`.
     */
    jsonTranslations<T extends Record<string, { notNull?: boolean }>>(
      fields: T,
    ): {
      [K in keyof T & string]: T[K] extends { notNull: true }
        ? NotNull<$Type<PgJsonbBuilderInitial<K>, LocaleMap<TLocales, TDefault>>>
        : $Type<PgJsonbBuilderInitial<K>, LocaleMap<TLocales, TDefault>>;
    } {
      const result: Record<string, any> = {};
      for (const name of Object.keys(fields)) {
        const cfg = fields[name];
        const col = jsonb(name).$type<LocaleMap<TLocales, TDefault>>();
        result[name] = cfg.notNull ? col.notNull() : col;
      }
      return result as any;
    },

    forLocale(
      column: PgColumn,
      locale: TLocales[number],
      opts?: { fallback?: TLocales[number] },
    ): SQL<string | null> {
      check(locale, "forLocale");
      if (opts?.fallback) check(opts.fallback, "forLocale fallback");
      return rawForLocale(column, locale, opts);
    },

    withTranslation(
      db: any,
      parent: PgTable,
      i18nResult: TranslationTableResult<PgTable>,
      opts: { locale: TLocales[number]; fallback?: TLocales[number] },
    ) {
      check(opts.locale, "withTranslation");
      if (opts.fallback) check(opts.fallback, "withTranslation fallback");
      return rawWithTranslation(db, parent, i18nResult, opts);
    },

    upsertTranslation(
      db: any,
      i18nResult: TranslationTableResult<PgTable>,
      data: Record<string, any>,
    ) {
      if (strict) {
        const localeVal = data[i18nResult.localeColumnName ?? "locale"];
        if (localeVal) validateLocale(localeVal, locales, "upsertTranslation");
      }
      return rawUpsertTranslation(db, i18nResult, data);
    },

    setTranslations(
      db: any,
      i18nResult: TranslationTableResult<PgTable>,
      data: {
        [key: string]: any;
        translations: Partial<Record<TLocales[number], Record<string, any>>>;
      },
    ) {
      if (strict) {
        for (const locale of Object.keys(data.translations)) {
          validateLocale(locale, locales, "setTranslations");
        }
      }
      return rawSetTranslations(db, i18nResult, data as any);
    },

    updateLocale(
      db: any,
      table: PgTable,
      column: PgColumn,
      opts: {
        where: SQL;
        locale: TLocales[number];
        value: string;
      },
    ) {
      check(opts.locale, "updateLocale");
      return rawUpdateLocale(db, table, column, opts);
    },

    insertWithTranslations(
      db: any,
      parent: PgTable,
      i18nResult: TranslationTableResult<PgTable>,
      data: {
        values: Record<string, any>;
        translations: Partial<Record<TLocales[number], Record<string, any>>>;
      },
    ) {
      if (strict) {
        for (const locale of Object.keys(data.translations)) {
          validateLocale(locale, locales, "insertWithTranslations");
        }
      }
      return rawInsertWithTranslations(db, parent, i18nResult, data as any);
    },
  };
}
