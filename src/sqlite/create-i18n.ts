import type { $Type, NotNull, SQL } from "drizzle-orm";
import type {
  SQLiteColumn,
  SQLiteColumnBuilderBase,
  SQLiteTable,
  SQLiteTextJsonBuilderInitial,
} from "drizzle-orm/sqlite-core";
import { text } from "drizzle-orm/sqlite-core";
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

    translationTable<
      TParent extends SQLiteTable,
      TColumns extends Record<string, SQLiteColumnBuilderBase>,
    >(parent: TParent, columns: TColumns, opts?: TranslationTableOptions) {
      return translationTable(parent, columns, opts);
    },

    jsonTranslations<T extends Record<string, { notNull?: boolean }>>(
      fields: T,
    ): {
      [K in keyof T & string]: T[K] extends { notNull: true }
        ? NotNull<$Type<SQLiteTextJsonBuilderInitial<K>, LocaleMap<TLocales, TDefault>>>
        : $Type<SQLiteTextJsonBuilderInitial<K>, LocaleMap<TLocales, TDefault>>;
    } {
      const result: Record<string, any> = {};
      for (const name of Object.keys(fields)) {
        const cfg = fields[name];
        const col = text(name, { mode: "json" }).$type<LocaleMap<TLocales, TDefault>>();
        result[name] = cfg.notNull ? col.notNull() : col;
      }
      return result as any;
    },

    forLocale(
      column: SQLiteColumn,
      locale: TLocales[number],
      opts?: { fallback?: TLocales[number] },
    ): SQL<string | null> {
      check(locale, "forLocale");
      if (opts?.fallback) check(opts.fallback, "forLocale fallback");
      return rawForLocale(column, locale, opts);
    },

    withTranslation(
      db: any,
      parent: SQLiteTable,
      i18nResult: TranslationTableResult<SQLiteTable>,
      opts: { locale: TLocales[number]; fallback?: TLocales[number] },
    ) {
      check(opts.locale, "withTranslation");
      if (opts.fallback) check(opts.fallback, "withTranslation fallback");
      return rawWithTranslation(db, parent, i18nResult, opts);
    },

    upsertTranslation(
      db: any,
      i18nResult: TranslationTableResult<SQLiteTable>,
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
      i18nResult: TranslationTableResult<SQLiteTable>,
      data: {
        [key: string]: any;
        translations: Partial<Record<TLocales[number], Record<string, any>>>;
      },
    ) {
      if (strict) {
        for (const l of Object.keys(data.translations))
          validateLocale(l, locales, "setTranslations");
      }
      return rawSetTranslations(db, i18nResult, data as any);
    },

    updateLocale(
      db: any,
      table: SQLiteTable,
      column: SQLiteColumn,
      opts: { where: SQL; locale: TLocales[number]; value: string },
    ) {
      check(opts.locale, "updateLocale");
      return rawUpdateLocale(db, table, column, opts);
    },

    insertWithTranslations(
      db: any,
      parent: SQLiteTable,
      i18nResult: TranslationTableResult<SQLiteTable>,
      data: {
        values: Record<string, any>;
        translations: Partial<Record<TLocales[number], Record<string, any>>>;
      },
    ) {
      if (strict) {
        for (const l of Object.keys(data.translations))
          validateLocale(l, locales, "insertWithTranslations");
      }
      return rawInsertWithTranslations(db, parent, i18nResult, data as any);
    },
  };
}
