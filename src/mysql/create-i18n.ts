import type { $Type, NotNull, SQL } from "drizzle-orm";
import type {
  MySqlColumn,
  MySqlColumnBuilderBase,
  MySqlJsonBuilderInitial,
  MySqlTable,
} from "drizzle-orm/mysql-core";
import { json } from "drizzle-orm/mysql-core";
import {
  exportTranslations as rawExportTranslations,
  importTranslations as rawImportTranslations,
} from "../core/batch.js";
import type { I18nConfig, LocaleMap } from "../core/config.js";
import { validateLocale } from "../core/config.js";
import { localizeResults as rawLocalizeResults } from "../core/localize-results.js";
import type {
  TranslationFieldValues,
  TranslationRowData,
  TranslationTableOptions,
  TranslationTableResult,
} from "../core/types.js";
import { missingTranslations as rawMissingTranslations } from "./missing.js";
import {
  insertWithTranslations as rawInsertWithTranslations,
  setTranslations as rawSetTranslations,
  updateLocale as rawUpdateLocale,
  upsertTranslation as rawUpsertTranslation,
} from "./mutate.js";
import { orderByLocale as rawOrderByLocale } from "./ordering.js";
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
      TParent extends MySqlTable,
      TColumns extends Record<string, MySqlColumnBuilderBase>,
    >(parent: TParent, columns: TColumns, opts?: TranslationTableOptions) {
      return translationTable(parent, columns, opts);
    },

    jsonTranslations<T extends Record<string, { notNull?: boolean }>>(
      fields: T,
    ): {
      [K in keyof T & string]: T[K] extends { notNull: true }
        ? NotNull<$Type<MySqlJsonBuilderInitial<K>, LocaleMap<TLocales, TDefault>>>
        : $Type<MySqlJsonBuilderInitial<K>, LocaleMap<TLocales, TDefault>>;
    } {
      const result: Record<string, any> = {};
      for (const name of Object.keys(fields)) {
        const cfg = fields[name];
        const col = json(name).$type<LocaleMap<TLocales, TDefault>>();
        result[name] = cfg.notNull ? col.notNull() : col;
      }
      return result as any;
    },

    forLocale(
      column: MySqlColumn,
      locale: TLocales[number],
      opts?: { fallback?: TLocales[number] },
    ): SQL<string | null> {
      check(locale, "forLocale");
      if (opts?.fallback) check(opts.fallback, "forLocale fallback");
      return rawForLocale(column, locale, opts);
    },

    withTranslation(
      db: any,
      parent: MySqlTable,
      i18nResult: TranslationTableResult<MySqlTable>,
      opts: { locale: TLocales[number]; fallback?: TLocales[number] },
    ) {
      check(opts.locale, "withTranslation");
      if (opts.fallback) check(opts.fallback, "withTranslation fallback");
      return rawWithTranslation(db, parent, i18nResult, opts);
    },

    localizeResults<
      TRow extends Record<string, any>,
      TRelationKey extends string = "translations",
      TColNames extends string = string,
    >(
      rows: TRow[],
      i18nResult: {
        translatableColumnNames: TColNames[];
        localeColumnName?: string;
      },
      opts: {
        locale: TLocales[number];
        fallback?: TLocales[number];
        relationKey?: TRelationKey;
      },
    ) {
      check(opts.locale, "localizeResults");
      if (opts.fallback) check(opts.fallback, "localizeResults fallback");
      return rawLocalizeResults(rows, i18nResult, opts);
    },

    missingTranslations(
      db: any,
      parent: MySqlTable,
      i18nResult: TranslationTableResult<MySqlTable>,
      locale: TLocales[number],
    ) {
      check(locale, "missingTranslations");
      return rawMissingTranslations(db, parent, i18nResult, locale);
    },

    orderByLocale(
      column: MySqlColumn,
      locale: TLocales[number],
      direction: "asc" | "desc" = "asc",
    ) {
      check(locale, "orderByLocale");
      return rawOrderByLocale(column, locale, direction);
    },

    upsertTranslation(
      db: any,
      i18nResult: TranslationTableResult<MySqlTable>,
      data: TranslationRowData,
    ) {
      if (strict) {
        const localeVal = data[i18nResult.localeColumnName ?? "locale"];
        if (typeof localeVal === "string") validateLocale(localeVal, locales, "upsertTranslation");
      }
      return rawUpsertTranslation(db, i18nResult, data);
    },

    setTranslations(
      db: any,
      i18nResult: TranslationTableResult<MySqlTable>,
      data: {
        [key: string]: unknown;
        translations: Partial<Record<TLocales[number], TranslationFieldValues>>;
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
      table: MySqlTable,
      column: MySqlColumn,
      opts: { where: SQL; locale: TLocales[number]; value: string },
    ) {
      check(opts.locale, "updateLocale");
      return rawUpdateLocale(db, table, column, opts);
    },

    insertWithTranslations(
      db: any,
      parent: MySqlTable,
      i18nResult: TranslationTableResult<MySqlTable>,
      data: {
        values: Record<string, unknown>;
        translations: Partial<Record<TLocales[number], TranslationFieldValues>>;
      },
    ) {
      if (strict) {
        for (const l of Object.keys(data.translations))
          validateLocale(l, locales, "insertWithTranslations");
      }
      return rawInsertWithTranslations(db, parent, i18nResult, data as any);
    },

    exportTranslations<TRow extends Record<string, any>>(
      rows: TRow[],
      i18nResult: { translatableColumnNames: string[] },
      fkKey: string,
      localeKey?: string,
    ) {
      return rawExportTranslations(rows, i18nResult, fkKey, localeKey);
    },

    importTranslations(
      data: Record<string | number, Record<string, Record<string, any>>>,
      fkKey: string,
      localeKey?: string,
    ) {
      if (strict) {
        for (const localesByParent of Object.values(data)) {
          for (const locale of Object.keys(localesByParent)) {
            validateLocale(locale, locales, "importTranslations");
          }
        }
      }
      return rawImportTranslations(data, fkKey, localeKey);
    },
  };
}
