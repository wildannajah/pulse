"use client";

import type { Platform } from "@pulse/types/platform";
import { PLATFORM_CONSTRAINTS, PLATFORM_LIST } from "@pulse/types/platform-constraints";
import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { cn } from "@/lib/utils/cn";

type DateRange = "7d" | "30d" | "90d";
const RANGES: DateRange[] = ["7d", "30d", "90d"];

export default function AnalyticsPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Analytics">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                "rounded-sm border border-border px-2.5 py-1 font-medium text-[12px]",
                dateRange === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
        {/* Platform tabs */}
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_LIST.map((key) => {
            const m = PLATFORM_CONSTRAINTS[key];
            const active = activePlatform === key;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setActivePlatform(key)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-[12px] transition-all"
                style={{
                  background: active ? m.chipBg : "var(--secondary)",
                  color: active ? m.chipText : "var(--muted-foreground)",
                  outline: active ? `2px solid ${m.color}30` : "none",
                }}
              >
                <PlatformIcon platform={key} size={14} />
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Empty state per platform */}
        <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
          <div>
            <PlatformIcon platform={activePlatform} size={32} />
            <p className="mt-4 text-[14px] font-medium text-muted-foreground">
              Analytics coming soon — populated by daily sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
