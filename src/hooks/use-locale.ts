"use client";

import * as React from "react";
import {
  getLocale,
  setLocale as setLocaleGlobal,
  subscribeLocale,
  isRTL,
  t,
  type Locale,
  localeLabel,
} from "@/lib/i18n";

export type { Locale };
export { localeLabel };

export function useLocale(initialLocale?: Locale) {
  const [locale, setLocaleState] = React.useState<Locale>(() => initialLocale ?? getLocale());

  React.useEffect(() => {
    const cookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("NEXT_LOCALE="));
    const saved = (cookie?.split("=")[1] as Locale | undefined) ?? initialLocale;
    if (saved && saved !== getLocale()) {
      setLocaleGlobal(saved);
      setLocaleState(saved);
    }
    return subscribeLocale(() => setLocaleState(getLocale()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLocale = React.useCallback((locale: Locale) => {
    setLocaleGlobal(locale);
  }, []);

  return {
    locale,
    setLocale: changeLocale,
    dir: isRTL(locale) ? "rtl" : "ltr",
    isRTL: isRTL(locale),
    t,
    localeLabel,
  };
}
