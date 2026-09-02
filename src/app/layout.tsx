import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EUNOIA ERB OS",
  description: "EUNOIA Business Operating System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "ar" ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <LocaleProvider initialLocale={locale}>
            {children}
            <Toaster />
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
