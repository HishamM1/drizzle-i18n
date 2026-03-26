/**
 * Configuration for createI18n().
 *
 * @template TLocales - Tuple of locale strings (pass `as const` for strict typing)
 * @template TDefault - The default/required locale
 */
export interface I18nConfig<
  TLocales extends readonly string[] = readonly string[],
  TDefault extends TLocales[number] = TLocales[number],
> {
  /** The default locale — always required in JSON translation maps. */
  defaultLocale: TDefault;
  /** All supported locales. Pass `as const` for strict compile-time validation. */
  locales: TLocales;
  /** If true, throws at runtime when an unknown locale is passed to query/mutation helpers. */
  strict?: boolean;
}

/**
 * Locale map type: the default locale is required, all others are optional.
 */
export type LocaleMap<TLocales extends readonly string[], TDefault extends string> = Record<
  TDefault,
  string
> &
  Partial<Record<Exclude<TLocales[number], TDefault>, string>>;

/**
 * Validate a locale string at runtime (when strict mode is enabled).
 */
export function validateLocale(locale: string, locales: readonly string[], context: string): void {
  if (!locales.includes(locale)) {
    throw new Error(
      `drizzle-i18n: unknown locale "${locale}" in ${context}. Valid locales: ${locales.join(", ")}`,
    );
  }
}
