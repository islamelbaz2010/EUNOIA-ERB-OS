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
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: "Employees", href: "/employees", icon: <Users className="h-5 w-5" /> },
      { label: "Attendance", href: "/attendance", icon: <Clock className="h-5 w-5" /> },
      { label: "Payroll", href: "/payroll", icon: <DollarSign className="h-5 w-5" /> },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Clients", href: "/clients", icon: <Briefcase className="h-5 w-5" /> },
      { label: "Services", href: "/services", icon: <FileText className="h-5 w-5" /> },
      { label: "Invoices", href: "/invoices", icon: <Receipt className="h-5 w-5" /> },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: <BarChart3 className="h-5 w-5" /> },
      { label: "Admin", href: "/admin", icon: <Settings className="h-5 w-5" /> },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
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
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-3">
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && (
                  <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
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
                      {item.label}
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
