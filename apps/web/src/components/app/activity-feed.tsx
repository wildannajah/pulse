"use client";

import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

import { MOCK_ACTIVITY, type MockActivityItem, type MockActivityType } from "@/lib/mock-data";
import { cn } from "@/lib/utils/cn";

const TYPE_META: Record<
  MockActivityType,
  { bg: string; fg: string; label: string; Icon: typeof Heart }
> = {
  like: {
    bg: "oklch(0.93 0.07 290)",
    fg: "oklch(0.32 0.14 290)",
    label: "like",
    Icon: Heart,
  },
  comment: {
    bg: "oklch(0.93 0.07 240)",
    fg: "oklch(0.32 0.14 240)",
    label: "comment",
    Icon: MessageCircle,
  },
  share: {
    bg: "oklch(0.94 0.08 150)",
    fg: "oklch(0.32 0.14 150)",
    label: "share",
    Icon: Share2,
  },
  mention: {
    bg: "oklch(0.96 0.07 80)",
    fg: "oklch(0.40 0.14 80)",
    label: "mention",
    Icon: MessageCircle,
  },
};

const FILTERS: ("all" | MockActivityType)[] = ["all", "like", "comment", "share"];

type ActivityFeedProps = {
  items?: MockActivityItem[];
};

export function ActivityFeed({ items = MOCK_ACTIVITY }: ActivityFeedProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const filtered = filter === "all" ? items : items.filter((a) => a.type === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-border border-b px-3.5 py-2.5">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-2.5 py-0.5 font-medium text-[11px] capitalize transition-all",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all" ? "All" : `${f}s`}
          </button>
        ))}
        <span className="ml-auto self-center text-[11px] text-muted-foreground">
          {filtered.length} events
        </span>
      </div>

      {/* Rows */}
      {filtered.map((item, i) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.Icon;
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-2.5 px-3.5 py-2.5",
              i < filtered.length - 1 && "border-border border-b",
            )}
          >
            {/* Avatar with platform badge */}
            <div className="relative flex-shrink-0">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: "oklch(0.90 0.05 275)",
                  color: "oklch(0.40 0.14 275)",
                }}
              >
                {item.initials}
              </div>
              <span className="absolute right-[-2px] bottom-[-2px] block rounded-[3px] border-[1.5px] border-card leading-none">
                <PlatformIcon platform={item.platform} size={13} />
              </span>
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <div className="text-[12px] leading-[1.5] text-foreground">
                <span className="font-semibold">{item.actor}</span>{" "}
                <span className="text-muted-foreground">{item.content}</span>
              </div>
              {item.post ? (
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  &quot;{item.post}&quot;
                </div>
              ) : null}
            </div>

            {/* Type badge + time */}
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[10px] capitalize"
                style={{ background: meta.bg, color: meta.fg }}
              >
                <Icon
                  size={10}
                  fill={item.type === "like" ? meta.fg : "none"}
                  stroke={item.type === "like" ? "none" : meta.fg}
                />
                {meta.label}
              </span>
              <span className="text-[10px] text-muted-foreground">{item.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
