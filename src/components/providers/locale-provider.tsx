"use client";

import * as React from "react";
import { useLocale, type Locale } from "@/hooks/use-locale";

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  useLocale(initialLocale);
  return <>{children}</>;
}
