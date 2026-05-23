"use client";

import { BrandMark } from "@pulse/ui/brand/brand-mark";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Image,
  Inbox,
  LayoutGrid,
  PenSquare,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { trpc } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils/cn";
import { useBrandStore } from "@/stores/brand-store";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutGrid },
  { href: "/app/composer", label: "Composer", icon: PenSquare },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/posts", label: "Posts", icon: Image },
  { href: "/app/activity", label: "Activity", icon: TrendingUp },
  { href: "/app/inbox", label: "Inbox", icon: Inbox },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

export type SidebarProps = {
  user: { name: string; email: string };
};

function getBrandInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrandId = useBrandStore((s) => s.setActiveBrandId);
  const [dropOpen, setDropOpen] = useState(false);

  const brandsQuery = trpc.brand.list.useQuery();

  useEffect(() => {
    const brands = brandsQuery.data;
    const first = brands?.[0];
    if (!first) return;
    const isValid = brands.some((b) => b.id === activeBrandId);
    if (!isValid) setActiveBrandId(first.id);
  }, [activeBrandId, setActiveBrandId, brandsQuery.data]);

  const activeBrand =
    brandsQuery.data?.find((b) => b.id === activeBrandId) ?? brandsQuery.data?.[0];

  const userInitials = user.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="z-10 flex h-screen w-[220px] flex-shrink-0 flex-col border-border border-r bg-card">
      {/* Brand lockup */}
      <div className="flex flex-shrink-0 items-center gap-2 border-border border-b px-4 py-3">
        <BrandMark size={28} />
        <span className="font-bold text-[15px] tracking-tight" style={{ color: "#5A5A8E" }}>
          Pulse
        </span>
      </div>

      {/* Brand switcher */}
      <div className="relative flex-shrink-0 border-border border-b px-2.5 py-1.5">
        {brandsQuery.isLoading ? (
          <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
        ) : (
          <button
            type="button"
            onClick={() => setDropOpen((o) => !o)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
              dropOpen ? "bg-secondary" : "bg-transparent hover:bg-secondary",
            )}
          >
            {activeBrand ? (
              <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded bg-primary text-[9px] font-bold text-primary-foreground">
                {getBrandInitials(activeBrand.name)}
              </div>
            ) : null}
            <span className="flex-1 truncate text-[13px] font-medium text-foreground">
              {activeBrand ? activeBrand.name : "No brands yet"}
            </span>
            <ChevronDown size={13} className="text-muted-foreground" />
          </button>
        )}
        {dropOpen ? (
          <div className="absolute top-[calc(100%+2px)] right-2.5 left-2.5 z-50 overflow-hidden rounded-md border border-border bg-card shadow-md">
            {brandsQuery.data && brandsQuery.data.length > 0 ? (
              brandsQuery.data.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => {
                    setActiveBrandId(b.id);
                    setDropOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px]",
                    b.id === activeBrand?.id ? "bg-secondary" : "bg-transparent hover:bg-secondary",
                  )}
                >
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-primary text-[8px] font-bold text-primary-foreground">
                    {getBrandInitials(b.name)}
                  </div>
                  <span className="flex-1 font-medium text-foreground">{b.name}</span>
                  {b.id === activeBrand?.id ? (
                    <Check size={12} className="text-muted-foreground" />
                  ) : null}
                </button>
              ))
            ) : (
              <Link
                href="/app/settings"
                className="block px-2.5 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => setDropOpen(false)}
              >
                Create your first brand →
              </Link>
            )}
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-px overflow-y-auto px-2.5 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/app" ? pathname === "/app" : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-secondary font-medium text-foreground"
                  : "bg-transparent text-foreground hover:bg-secondary",
              )}
            >
              <Icon size={15} className={active ? "text-foreground" : "text-muted-foreground"} />
              <span className="flex-1">{item.label}</span>
              {item.count ? (
                <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — settings + user */}
      <div className="flex-shrink-0 border-border border-t px-2.5 py-1.5">
        <Link
          href="/app/settings/connections"
          className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground hover:bg-secondary"
        >
          <Settings size={15} className="text-muted-foreground" />
          Settings
        </Link>
        <div className="mb-1 flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-bold text-white">
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <div className="truncate text-[12px] font-semibold text-foreground">{user.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
