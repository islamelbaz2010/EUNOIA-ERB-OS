"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, type Locale } from "@/hooks/use-locale";

export function LocaleSwitcher() {
  const { locale, setLocale, t, localeLabel } = useLocale();

  const options: Locale[] = ["en", "ar"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("common.language")}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t("common.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code)}
            className={locale === code ? "bg-accent" : ""}
          >
            {localeLabel[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
