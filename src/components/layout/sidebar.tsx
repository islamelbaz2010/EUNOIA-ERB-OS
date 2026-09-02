"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocale } from "@/hooks/use-locale";
import {
  LayoutDashboard,
  Users,
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  titleKey?: string;
  items: NavItem[];
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLocale();
  const user = session?.user as any;

  const navSections: NavSection[] = [
    {
      items: [
        { labelKey: "nav.dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { labelKey: "nav.employees", href: "/employees", icon: <Users className="h-5 w-5" /> },
        { labelKey: "nav.attendance", href: "/attendance", icon: <Clock className="h-5 w-5" /> },
        { labelKey: "nav.payroll", href: "/payroll", icon: <DollarSign className="h-5 w-5" /> },
      ],
    },
    {
      titleKey: "common.operations",
      items: [
        { labelKey: "nav.clients", href: "/clients", icon: <Briefcase className="h-5 w-5" /> },
        { labelKey: "nav.services", href: "/services", icon: <FileText className="h-5 w-5" /> },
        { labelKey: "nav.invoices", href: "/invoices", icon: <Receipt className="h-5 w-5" /> },
      ],
    },
    {
      titleKey: "common.insights",
      items: [
        { labelKey: "nav.reports", href: "/reports", icon: <BarChart3 className="h-5 w-5" /> },
        { labelKey: "nav.admin", href: "/admin", icon: <Settings className="h-5 w-5" /> },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              E
            </div>
            <span className="text-lg font-bold">EUNOIA</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-3">
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.titleKey && (
                  <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(section.titleKey)}
                  </h4>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email ?? ""}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => signOut({ callbackUrl: "/login" })} aria-label={t("common.signOut")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
