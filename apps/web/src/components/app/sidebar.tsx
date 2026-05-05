"use client";

import { BrandMark } from "@pulse/ui/brand/brand-mark";
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

import { MOCK_BRANDS } from "@/lib/mock-data";
import { cn } from "@/lib/utils/cn";
import { useBrandStore } from "@/stores/brand-store";

type NavItem = {
  href: string;
  label: string;
  // biome-ignore lint/suspicious/noExplicitAny: lucide icon component types are wide
  icon: any;
  count?: number;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutGrid },
  { href: "/app/composer", label: "Composer", icon: PenSquare },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/posts", label: "Posts", icon: Image },
  { href: "/app/activity", label: "Activity", icon: TrendingUp },
  { href: "/app/inbox", label: "Inbox", icon: Inbox, count: 2 },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

export type SidebarProps = {
  user: { name: string; email: string };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrandId = useBrandStore((s) => s.setActiveBrandId);
  const [dropOpen, setDropOpen] = useState(false);

  // Default to first brand if none selected (mock-data path; real flow seeds via server component)
  useEffect(() => {
    if (!activeBrandId && MOCK_BRANDS[0]) {
      setActiveBrandId(MOCK_BRANDS[0].id);
    }
  }, [activeBrandId, setActiveBrandId]);

  const activeBrand = MOCK_BRANDS.find((b) => b.id === activeBrandId) ?? MOCK_BRANDS[0]!;

  const initials = user.name
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
        <button
          type="button"
          onClick={() => setDropOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
            dropOpen ? "bg-secondary" : "bg-transparent hover:bg-secondary",
          )}
        >
          <div
            className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
            style={{ background: activeBrand.color }}
          >
            {activeBrand.initials}
          </div>
          <span className="flex-1 truncate text-[13px] font-medium text-foreground">
            {activeBrand.name}
          </span>
          <ChevronDown size={13} className="text-muted-foreground" />
        </button>
        {dropOpen ? (
          <div className="absolute top-[calc(100%+2px)] right-2.5 left-2.5 z-50 overflow-hidden rounded-md border border-border bg-card shadow-md">
            {MOCK_BRANDS.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => {
                  setActiveBrandId(b.id);
                  setDropOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px]",
                  b.id === activeBrand.id ? "bg-secondary" : "bg-transparent hover:bg-secondary",
                )}
              >
                <div
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[8px] font-bold text-white"
                  style={{ background: b.color }}
                >
                  {b.initials}
                </div>
                <span className="flex-1 font-medium text-foreground">{b.name}</span>
                {b.id === activeBrand.id ? (
                  <Check size={12} className="text-muted-foreground" />
                ) : null}
              </button>
            ))}
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
        <button
          type="button"
          className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground hover:bg-secondary"
        >
          <Settings size={15} className="text-muted-foreground" />
          Settings
        </button>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-bold text-white">
            {initials}
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
