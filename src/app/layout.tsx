import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/use-toast";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EUNOIA ERB OS",
  description: "EUNOIA Business Operating System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="ltr">
      <body className={inter.className}>
        <ToastProvider>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
