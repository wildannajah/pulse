"use client";

import type { Platform } from "@pulse/types/platform";
import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { ExternalLink, MoreHorizontal, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { PlatformBadge } from "@/components/app/platform-badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils/cn";

type Filter = string; // platform lowercase or "all"

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter/X" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
];

// Prisma Platform enum values are uppercase; map to lowercase for display
function toPlatform(prismaValue: string): Platform {
  return prismaValue.toLowerCase() as Platform;
}

export default function InboxPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const inboxQuery = trpc.inbox.list.useQuery({});
  const items = inboxQuery.data?.items ?? [];

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((m) => m.platform.toLowerCase() === filter)),
    [filter, items],
  );

  const selected = items.find((m) => m.id === selectedId) ?? null;

  function getSenderLabel(
    senderDisplayName: string | null | undefined,
    senderUsername: string | null | undefined,
  ): string {
    return senderDisplayName ?? senderUsername ?? "Unknown";
  }

  function getInitials(label: string): string {
    return label
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Inbox">
        <span className="text-[12px] font-medium text-muted-foreground">
          {items.length} messages
        </span>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Message list */}
        <div className="flex w-[320px] flex-shrink-0 flex-col border-border border-r bg-card">
          <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-border border-b px-3 py-2.5">
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-medium text-[11px] whitespace-nowrap",
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-shrink-0 border-border border-b px-3 py-2">
            <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5">
              <Search size={13} className="text-muted-foreground" />
              <input
                placeholder="Search messages…"
                className="w-full border-0 bg-transparent text-[12px] outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {inboxQuery.isLoading ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-md bg-secondary" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No messages yet"
                description="They'll appear when inbox-sync workers populate the table."
              />
            ) : (
              filtered.map((msg) => {
                const isSel = selectedId === msg.id;
                const label = getSenderLabel(msg.senderDisplayName, msg.senderUsername);
                const initials = getInitials(label);
                const platform = toPlatform(msg.platform);
                return (
                  <button
                    type="button"
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className={cn(
                      "flex w-full gap-2.5 border-border border-b px-3.5 py-3 text-left transition-colors",
                      isSel ? "bg-secondary" : "bg-transparent hover:bg-secondary/50",
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-300 text-[11px] font-bold text-muted-foreground">
                        {initials}
                      </div>
                      <span className="absolute right-[-2px] bottom-[-2px] rounded-[3px] border-[1.5px] border-card leading-none">
                        <PlatformIcon platform={platform} size={14} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline justify-between gap-1.5">
                        <span className="truncate text-[12px] font-semibold text-foreground">
                          {label}
                        </span>
                        <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                          {new Date(msg.receivedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="truncate text-[12px] leading-snug text-muted-foreground">
                        {msg.content}
                      </div>
                    </div>
                    {msg.status === "UNREAD" ? (
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 self-start rounded-full bg-foreground" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail */}
        {selected ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-shrink-0 items-center gap-3 border-border border-b bg-card px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-300 text-[13px] font-bold text-muted-foreground">
                {getInitials(getSenderLabel(selected.senderDisplayName, selected.senderUsername))}
              </div>
              <div>
                <div className="text-[14px] font-semibold">
                  {getSenderLabel(selected.senderDisplayName, selected.senderUsername)}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <PlatformBadge platform={toPlatform(selected.platform)} />
                  <span>· {new Date(selected.receivedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="ml-auto flex gap-1.5">
                <Button variant="outline" size="sm">
                  <ExternalLink size={13} />
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal size={13} />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              <div className="max-w-[480px] self-start rounded-lg bg-secondary px-4 py-3.5">
                <p className="m-0 text-[14px] leading-relaxed text-foreground">
                  {selected.content}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-end gap-2.5 border-border border-t bg-card px-6 py-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${getSenderLabel(selected.senderDisplayName, selected.senderUsername)}…`}
                className="min-h-[60px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] leading-snug outline-none focus:ring-2 focus:ring-ring/40"
              />
              <Button>
                <Send size={13} />
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] text-muted-foreground">
            Select a message
          </div>
        )}
      </div>
    </div>
  );
}
