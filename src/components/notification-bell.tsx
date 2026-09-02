"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/hooks/use-locale";
import { formatDateTime } from "@/lib/i18n";

interface Notification {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  createdAt: string;
  user?: { name?: string };
}

export function NotificationBell() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => setItems(data.notifications || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const hasItems = items.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("common.notifications")}>
          <Bell className="h-5 w-5" />
          {hasItems && (
            <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3 font-medium">{t("notification.title")}</div>
        <ScrollArea className="h-72">
          {loading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !hasItems ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("notification.empty")}
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-4 hover:bg-muted/50">
                  <p className="text-sm font-medium">
                    {item.action} {item.entity}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
