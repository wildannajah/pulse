"use client";

import { PLATFORM_CONSTRAINTS, PLATFORM_LIST } from "@pulse/types/platform-constraints";
import { type Platform, PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { Check, Reply, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { PlatformBadge } from "@/components/app/platform-badge";
import { Button } from "@/components/ui/button";
import { MOCK_ACTIVITY, type MockActivityType } from "@/lib/mock-data";
import { cn } from "@/lib/utils/cn";

type TypeFilter = MockActivityType | "all";
type PlatformFilter = Platform | "all";
type SortMode = "newest" | "oldest";

const TYPE_META: Record<MockActivityType, { bg: string; fg: string; label: string }> = {
  like: { bg: "oklch(0.93 0.07 290)", fg: "oklch(0.32 0.14 290)", label: "Like" },
  comment: { bg: "oklch(0.93 0.07 240)", fg: "oklch(0.32 0.14 240)", label: "Comment" },
  share: { bg: "oklch(0.94 0.08 150)", fg: "oklch(0.32 0.14 150)", label: "Share" },
  mention: { bg: "oklch(0.96 0.07 80)", fg: "oklch(0.40 0.14 80)", label: "Mention" },
};

const TYPES: TypeFilter[] = ["all", "like", "comment", "share", "mention"];

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const typeCounts = useMemo(() => {
    const counts: Record<MockActivityType, number> = { like: 0, comment: 0, share: 0, mention: 0 };
    for (const a of MOCK_ACTIVITY) counts[a.type] += 1;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    return MOCK_ACTIVITY.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (platformFilter !== "all" && a.platform !== platformFilter) return false;
      const q = search.toLowerCase();
      if (q) {
        const hay = `${a.actor} ${a.post ?? ""} ${a.content}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (sort === "newest" ? b.ts - a.ts : a.ts - b.ts));
  }, [typeFilter, platformFilter, sort, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Activity">
        <span className="text-[12px] font-medium text-muted-foreground">
          {MOCK_ACTIVITY.length} total events
        </span>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-border border-b bg-card px-7 py-2.5">
        <div className="flex min-w-[180px] items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5">
          <Search size={13} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity…"
            className="w-full border-0 bg-transparent text-[12px] outline-none"
          />
        </div>

        <div className="flex gap-1">
          {TYPES.map((t) => {
            const meta = t === "all" ? null : TYPE_META[t];
            const active = typeFilter === t;
            const count = t === "all" ? MOCK_ACTIVITY.length : typeCounts[t];
            return (
              <button
                type="button"
                key={t}
                onClick={() => setTypeFilter(t)}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium text-[12px]"
                style={
                  active
                    ? meta
                      ? { background: meta.bg, color: meta.fg }
                      : undefined
                    : { background: "var(--secondary)", color: "var(--muted-foreground)" }
                }
              >
                <span style={active && !meta ? { color: "var(--primary-foreground)" } : undefined}>
                  {t === "all" ? "All" : `${meta?.label}s`}
                </span>
                <span
                  className="min-w-4 rounded-full px-1.5 text-center text-[10px]"
                  style={{
                    background: active ? "oklch(0 0 0 / 10%)" : "var(--border)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPlatformFilter("all")}
            className={cn(
              "rounded-full px-2.5 py-0.5 font-medium text-[12px]",
              platformFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            All platforms
          </button>
          {PLATFORM_LIST.slice(0, 4).map((p) => {
            const m = PLATFORM_CONSTRAINTS[p];
            const active = platformFilter === p;
            return (
              <button
                type="button"
                key={p}
                onClick={() => setPlatformFilter(p)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[12px]"
                style={{
                  background: active ? m.chipBg : "var(--secondary)",
                  color: active ? m.chipText : "var(--muted-foreground)",
                }}
              >
                <PlatformIcon platform={p} size={13} />
                {m.name}
              </button>
            );
          })}
        </div>

        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="cursor-pointer rounded-md border border-border bg-background px-2.5 py-1 text-[12px] outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Result count + bulk */}
      <div className="flex flex-shrink-0 items-center gap-2.5 border-border border-b px-7 py-2">
        <span className="text-[12px] font-medium text-muted-foreground">
          {filtered.length} event{filtered.length === 1 ? "" : "s"}
          {selected.size > 0 ? (
            <span className="ml-2" style={{ color: "oklch(0.52 0.22 275)" }}>
              · {selected.size} selected
            </span>
          ) : null}
        </span>
        {selected.size > 0 ? (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm">
              Reply all
            </Button>
            <Button variant="outline" size="sm">
              Mark read
            </Button>
          </div>
        ) : null}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-7">
        {filtered.length === 0 ? (
          <div className="py-15 text-center text-[14px] text-muted-foreground">
            No activity matches your filters.
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            {filtered.map((item, i) => {
              const meta = TYPE_META[item.type];
              const isSel = selected.has(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    i < filtered.length - 1 && "border-border border-b",
                    isSel ? "bg-secondary" : "bg-transparent",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm"
                    style={{
                      border: isSel ? "none" : "1.5px solid var(--border)",
                      background: isSel ? "oklch(0.62 0.20 275)" : "transparent",
                    }}
                  >
                    {isSel ? <Check size={9} className="text-white" strokeWidth={3} /> : null}
                  </button>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
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
                    <div className="text-[13px] leading-[1.5] text-foreground">
                      <span className="font-semibold">{item.actor}</span>{" "}
                      <span className="text-muted-foreground">{item.content}</span>
                    </div>
                    {item.post ? (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        on &quot;{item.post}&quot;
                      </div>
                    ) : null}
                  </div>

                  <span
                    className="inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-medium text-[11px]"
                    style={{ background: meta.bg, color: meta.fg }}
                  >
                    {meta.label}
                  </span>

                  <div className="flex-shrink-0">
                    <PlatformBadge platform={item.platform} />
                  </div>

                  <span className="min-w-14 flex-shrink-0 text-right text-[11px] text-muted-foreground">
                    {item.time}
                  </span>

                  {item.type === "comment" ? (
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Reply size={11} />
                      Reply
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
