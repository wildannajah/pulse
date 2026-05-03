import { type Platform, PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { Plus } from "lucide-react";
import Link from "next/link";

import { ActivityFeed } from "@/components/app/activity-feed";
import { PageHeader } from "@/components/app/page-header";
import { PostCard } from "@/components/app/post-card";
import { Button } from "@/components/ui/button";
import { MOCK_PLATFORM_FOLLOWERS, MOCK_POSTS } from "@/lib/mock-data";
import { PLATFORM_LIST, PLATFORM_META } from "@/lib/platform-meta";

const STAT_CARDS = [
  { label: "Total followers", value: "143.4k", delta: "+2.1%", up: true as const },
  { label: "Posts scheduled", value: "12", delta: "this week", up: null },
  { label: "Avg engagement", value: "3.8%", delta: "+0.4pp", up: true as const },
  { label: "Unread messages", value: "8", delta: "2 new", up: null },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Dashboard">
        <Button size="sm" asChild>
          <Link href="/app/composer">
            <Plus size={14} />
            New post
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card px-5 py-4">
              <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{s.label}</div>
              <div className="mb-1 text-[26px] font-bold leading-none tracking-tight">
                {s.value}
              </div>
              <div
                className={
                  s.up === true
                    ? "text-[12px] font-medium"
                    : "text-[12px] font-medium text-muted-foreground"
                }
                style={s.up === true ? { color: "oklch(0.5 0.18 150)" } : undefined}
              >
                {s.up === true ? "↑ " : ""}
                {s.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Platform overview */}
        <section className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="mb-3.5 text-[13px] font-semibold text-foreground">Platform overview</div>
          <div className="grid grid-cols-7 gap-2">
            {PLATFORM_LIST.map((p) => {
              const meta = PLATFORM_META[p as Platform];
              return (
                <div
                  key={p}
                  className="flex flex-col items-center gap-1.5 rounded-md bg-secondary px-1.5 py-2.5"
                >
                  <PlatformIcon platform={p} size={22} />
                  <div className="text-[12px] font-semibold text-foreground tracking-tight">
                    {MOCK_PLATFORM_FOLLOWERS[p]}
                  </div>
                  <div className="text-center text-[10px] leading-tight text-muted-foreground">
                    {meta.name}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Activity feed */}
        <section>
          <div className="mb-3 text-[13px] font-semibold text-foreground">Recent activity</div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <ActivityFeed />
          </div>
        </section>

        {/* Recent posts */}
        <section>
          <div className="mb-3 text-[13px] font-semibold text-foreground">Recent posts</div>
          <div className="grid grid-cols-3 gap-3">
            {MOCK_POSTS.slice(0, 6).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
