"use client";

import type { Platform } from "@pulse/types/platform";
import { PLATFORM_CONSTRAINTS, PLATFORM_LIST } from "@pulse/types/platform-constraints";
import { mapPrismaStatusToUiStatus, type PostStatus } from "@pulse/types/post-status";
import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils/cn";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const STATUS_FILTERS: { id: "all" | PostStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "failed", label: "Failed" },
];

type CalendarPost = {
  id: string;
  content: string;
  status: string;
  scheduledAt: Date | string | null;
  publishedAt: Date | string | null;
};

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// `post.list` doesn't yet expose per-publication platforms — default to twitter
// for chip styling until the procedure includes `publications.platform[]`.
function inferPlatform(_post: CalendarPost): Platform {
  return "twitter";
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));
  const [platformFilter, setPlatformFilter] = useState<"all" | Platform>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");

  const postsQuery = trpc.post.list.useQuery({ limit: 100 });
  const allPosts = (postsQuery.data?.posts ?? []) as CalendarPost[];

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      if (statusFilter !== "all") {
        if (mapPrismaStatusToUiStatus(post.status) !== statusFilter) return false;
      }
      if (platformFilter !== "all") {
        if (inferPlatform(post) !== platformFilter) return false;
      }
      return true;
    });
  }, [allPosts, statusFilter, platformFilter]);

  const monthName = MONTH_NAMES[cursor.getMonth()];
  const year = cursor.getFullYear();
  const firstDow = new Date(year, cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, cursor.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDow + daysInMonth });

  function getDayPosts(day: number) {
    return filteredPosts.filter((p) => {
      const raw = p.scheduledAt ?? p.publishedAt;
      if (!raw) return false;
      const date = new Date(raw);
      return (
        date.getDate() === day &&
        date.getMonth() === cursor.getMonth() &&
        date.getFullYear() === cursor.getFullYear()
      );
    });
  }

  const selectedPosts = filteredPosts.filter((p) => {
    const raw = p.scheduledAt ?? p.publishedAt;
    if (!raw) return false;
    return sameDay(new Date(raw), selectedDate);
  });

  const goPrevMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNextMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Calendar">
        <Button size="sm" asChild>
          <Link href="/app/composer">
            <Plus size={14} />
            New post
          </Link>
        </Button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-7">
          {/* Month nav */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-[16px] tracking-tight">
              {monthName} {year}
            </h2>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={goPrevMonth} aria-label="Previous month">
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goNextMonth} aria-label="Next month">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter size={12} />
              Filters
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setPlatformFilter("all")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  platformFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                All platforms
              </button>
              {PLATFORM_LIST.map((p) => {
                const meta = PLATFORM_CONSTRAINTS[p];
                const active = platformFilter === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlatformFilter(p)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      active
                        ? "text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                    style={active ? { background: meta.color } : undefined}
                  >
                    <PlatformIcon platform={p} size={11} />
                    {meta.name}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex flex-wrap gap-1">
              {STATUS_FILTERS.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    statusFilter === s.id
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="px-0 py-1.5 text-center font-semibold text-[11px] tracking-wider text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((_, i) => {
              const day = i - firstDow + 1;
              const valid = day >= 1 && day <= daysInMonth;
              if (!valid) {
                // biome-ignore lint/suspicious/noArrayIndexKey: empty calendar cells have no other identity
                return <div key={`empty-${i}`} className="min-h-20" />;
              }
              const cellDate = new Date(year, cursor.getMonth(), day);
              const posts = getDayPosts(day);
              const isToday = sameDay(cellDate, today);
              const isSelected = sameDay(cellDate, selectedDate);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDate(cellDate)}
                  className={cn(
                    "flex min-h-20 flex-col gap-1 rounded-md border p-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : isToday
                        ? "border-primary/40 bg-card"
                        : "border-border bg-card hover:border-primary/20",
                  )}
                >
                  <span
                    className={cn(
                      "self-start rounded-full text-[12px] font-semibold leading-none",
                      isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "",
                    )}
                  >
                    {day}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {posts.slice(0, 3).map((post, pi) => {
                      const platform = inferPlatform(post);
                      const meta = PLATFORM_CONSTRAINTS[platform];
                      const uiStatus = mapPrismaStatusToUiStatus(post.status);
                      return (
                        <div
                          key={post.id ?? `${day}-${pi}`}
                          className="flex items-center gap-1 overflow-hidden rounded-sm px-1.5 py-0.5"
                          style={{
                            background: isSelected ? "oklch(1 0 0 / 15%)" : meta.chipBg,
                          }}
                        >
                          <span
                            className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{ background: meta.color }}
                          />
                          <span
                            className="truncate text-[10px] font-medium"
                            style={{ color: isSelected ? "white" : meta.chipText }}
                          >
                            {uiStatus}
                          </span>
                        </div>
                      );
                    })}
                    {posts.length > 3 ? (
                      <span
                        className={cn(
                          "px-1.5 text-[10px] font-medium",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        +{posts.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <aside className="flex w-[260px] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-border border-l bg-card p-5">
          <div className="text-[13px] font-semibold">
            {monthName} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </div>
          {postsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : selectedPosts.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              description="No posts on this day match the current filters."
              action={{ label: "Add a post", href: "/app/composer" }}
            />
          ) : (
            selectedPosts.map((post) => {
              const uiStatus = mapPrismaStatusToUiStatus(post.status);
              const platform = inferPlatform(post);
              return (
                <div
                  key={post.id}
                  className="flex flex-col gap-1.5 rounded-md bg-secondary px-3 py-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <PlatformIcon platform={platform} size={16} />
                    <StatusBadge status={uiStatus} />
                  </div>
                  <div className="text-[12px] leading-relaxed text-muted-foreground">
                    {post.content.slice(0, 80)}
                    {post.content.length > 80 ? "…" : ""}
                  </div>
                </div>
              );
            })
          )}
          <Button variant="outline" size="sm" className="mt-auto" asChild>
            <Link href="/app/composer">
              <Plus size={13} /> Add to this day
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
