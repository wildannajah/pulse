"use client";

import { PLATFORM_LIST } from "@pulse/types/platform-constraints";
import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { Plus, Zap } from "lucide-react";
import Link from "next/link";
import { ActivityFeed } from "@/components/app/activity-feed";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/trpc";

export default function DashboardPage() {
  const accountsQuery = trpc.connectedAccount.list.useQuery();
  const hasAccounts = (accountsQuery.data?.length ?? 0) > 0;

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
        {/* Welcome hero */}
        <div className="rounded-lg border border-border bg-card px-7 py-8 text-center">
          <h2 className="mb-1.5 text-[20px] font-bold tracking-tight text-foreground">
            Welcome to Pulse
          </h2>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Manage all your social accounts from one place.
          </p>
          {accountsQuery.isLoading ? null : hasAccounts ? (
            <Button asChild>
              <Link href="/app/composer">
                <Zap size={14} />
                Start your first post
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/app/settings/connections">Connect your first account</Link>
            </Button>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[{ label: "Followers" }, { label: "Posts published" }, { label: "Engagement" }].map(
            (s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card px-5 py-4">
                <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">
                  {s.label}
                </div>
                <div className="mb-1 text-[26px] font-bold leading-none tracking-tight">—</div>
                <div className="text-[11px] text-muted-foreground">
                  Stats appear after your first sync.
                </div>
              </div>
            ),
          )}
        </div>

        {/* Platform overview */}
        <section className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="mb-3.5 text-[13px] font-semibold text-foreground">Platform overview</div>
          <div className="grid grid-cols-7 gap-2">
            {PLATFORM_LIST.map((p) => (
              <div
                key={p}
                className="flex flex-col items-center gap-1.5 rounded-md bg-secondary px-1.5 py-2.5"
              >
                <PlatformIcon platform={p} size={22} />
                <div className="text-[12px] font-semibold tracking-tight text-muted-foreground">
                  —
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity feed */}
        <section>
          <div className="mb-3 text-[13px] font-semibold text-foreground">Recent activity</div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <ActivityFeed />
          </div>
        </section>

        {/* Recent posts empty */}
        <section>
          <div className="mb-3 text-[13px] font-semibold text-foreground">Recent posts</div>
          <div className="rounded-lg border border-border bg-card">
            <EmptyState
              title="No posts yet"
              description="Write your first post to see it here."
              action={{ label: "New post", href: "/app/composer" }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
