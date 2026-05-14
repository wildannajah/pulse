"use client";

import { PLATFORM_CONSTRAINTS } from "@pulse/types/platform-constraints";
import { mapPrismaStatusToUiStatus } from "@pulse/types/post-status";
import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils/cn";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAYS_IN_MONTH = 30;
const FIRST_DOW = 3; // April 2026 starts on Wednesday
const TODAY = 28;
const CURRENT_MONTH = 3; // April = 3 (0-indexed)
const CURRENT_YEAR = 2026;

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(29);
  const postsQuery = trpc.post.list.useQuery({ limit: 100 });
  const allPosts = postsQuery.data?.posts ?? [];

  const cells = Array.from({ length: FIRST_DOW + DAYS_IN_MONTH });

  function getDayPosts(day: number) {
    return allPosts.filter((p) => {
      const d = p.scheduledAt ?? p.publishedAt;
      if (!d) return false;
      const date = new Date(d);
      return (
        date.getDate() === day &&
        date.getMonth() === CURRENT_MONTH &&
        date.getFullYear() === CURRENT_YEAR
      );
    });
  }

  const selectedPosts = getDayPosts(selectedDay);

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
        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-[16px] tracking-tight">April 2026</h2>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm">
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="sm">
                Today
              </Button>
              <Button variant="outline" size="sm">
                <ChevronRight size={14} />
              </Button>
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
              const day = i - FIRST_DOW + 1;
              const valid = day >= 1 && day <= DAYS_IN_MONTH;
              if (!valid) {
                // biome-ignore lint/suspicious/noArrayIndexKey: empty calendar cells have no other identity
                return <div key={`empty-${i}`} className="min-h-20" />;
              }
              const posts = getDayPosts(day);
              const isToday = day === TODAY;
              const isSelected = day === selectedDay;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDay(day)}
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
                    {posts.map((post, pi) => {
                      const platform = "twitter";
                      const meta = PLATFORM_CONSTRAINTS[platform];
                      const uiStatus = mapPrismaStatusToUiStatus(post.status);
                      return (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: same-day posts use index to disambiguate
                          key={`${day}-${pi}`}
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
                            style={{
                              color: isSelected ? "white" : meta.chipText,
                            }}
                          >
                            {uiStatus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <aside className="flex w-[260px] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-border border-l bg-card p-5">
          <div className="text-[13px] font-semibold">April {selectedDay}</div>
          {selectedPosts.length === 0 ? (
            <div className="text-[13px] leading-relaxed text-muted-foreground">
              No posts scheduled.
              <br />
              <Link
                href="/app/composer"
                className="mt-1 font-medium text-foreground underline-offset-4 hover:underline"
              >
                Add one
              </Link>
            </div>
          ) : (
            selectedPosts.map((post, i) => {
              const uiStatus = mapPrismaStatusToUiStatus(post.status);
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: detail-panel order is the canonical identity here
                  key={`detail-${i}`}
                  className="flex flex-col gap-1.5 rounded-md bg-secondary px-3 py-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <PlatformIcon platform="twitter" size={16} />
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
