"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils/cn";
import { useBrandStore } from "@/stores/brand-store";

const MAX_PREVIEW = 5;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);

  const inboxQuery = trpc.inbox.list.useQuery(
    {},
    {
      enabled: !!activeBrandId,
      refetchOnWindowFocus: true,
    },
  );

  const items = inboxQuery.data?.items ?? [];
  const unread = items.filter((m) => m.status === "UNREAD");
  const unreadCount = unread.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-md transition-colors",
          open ? "bg-secondary" : "hover:bg-secondary",
        )}
      >
        <Bell size={15} className="text-muted-foreground" />
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {/* Click-outside scrim */}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />
          <div className="absolute right-0 z-50 mt-1.5 w-[300px] overflow-hidden rounded-md border border-border bg-card shadow-md">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-[12px] font-semibold">Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-[11px] text-muted-foreground">{unreadCount} unread</span>
              ) : null}
            </div>
            <div className="max-h-[340px] overflow-y-auto">
              {inboxQuery.isLoading ? (
                <div className="flex flex-col gap-2 p-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
                  ))}
                </div>
              ) : unread.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  You're all caught up.
                </div>
              ) : (
                unread.slice(0, MAX_PREVIEW).map((m) => {
                  const sender = m.senderDisplayName ?? m.senderUsername ?? "Unknown";
                  return (
                    <Link
                      key={m.id}
                      href="/app/inbox"
                      onClick={() => setOpen(false)}
                      className="flex flex-col gap-0.5 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-secondary"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[12px] font-semibold text-foreground">
                          {sender}
                        </span>
                        <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(m.receivedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <span className="truncate text-[12px] text-muted-foreground">
                        {m.content}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="border-t border-border bg-secondary/40 px-2 py-1.5">
              <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                <Link href="/app/inbox" onClick={() => setOpen(false)}>
                  Open inbox
                </Link>
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
