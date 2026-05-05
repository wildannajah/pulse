"use client";

import { PLATFORM_CONSTRAINTS, PLATFORM_LIST } from "@pulse/types/platform-constraints";
import { type Platform, PlatformIcon } from "@pulse/ui/icons/platform-icon";
import {
  Check,
  Clock,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { MOCK_POSTS, type MockPost, type PostStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils/cn";

type StatusFilter = PostStatus | "all";
type PlatformFilter = Platform | "all";
type SortMode = "date-desc" | "date-asc" | "likes" | "reach" | "comments";
type ViewMode = "grid" | "list";

const HEART_ACTIVE = "oklch(0.52 0.22 275)";

export default function PostsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [sort, setSort] = useState<SortMode>("date-desc");
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return MOCK_POSTS.filter((p) => {
      if (search && !p.content.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (platformFilter !== "all" && !p.platforms.includes(platformFilter)) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "date-desc") return (b.date ?? "").localeCompare(a.date ?? "");
      if (sort === "date-asc") return (a.date ?? "").localeCompare(b.date ?? "");
      if (sort === "likes") return b.likes - a.likes;
      if (sort === "reach") return b.reach - a.reach;
      if (sort === "comments") return b.comments - a.comments;
      return 0;
    });
  }, [search, statusFilter, platformFilter, sort]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const STATUSES: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All status" },
    { value: "published", label: "Published" },
    { value: "scheduled", label: "Scheduled" },
    { value: "draft", label: "Draft" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Posts">
        <Button size="sm">
          <Plus size={14} />
          New post
        </Button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5 border-border border-b bg-card px-7 py-2.5">
        {/* Search */}
        <div className="flex min-w-[200px] items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5">
          <Search size={13} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full border-0 bg-transparent text-[12px] outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <ChipBtn
              key={s.value}
              active={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </ChipBtn>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Platform filter */}
        <div className="flex items-center gap-1">
          <ChipBtn active={platformFilter === "all"} onClick={() => setPlatformFilter("all")}>
            All platforms
          </ChipBtn>
          {PLATFORM_LIST.slice(0, 4).map((p) => {
            const m = PLATFORM_CONSTRAINTS[p];
            const active = platformFilter === p;
            return (
              <button
                type="button"
                key={p}
                onClick={() => setPlatformFilter(p)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[12px] transition-all"
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

        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="cursor-pointer rounded-md border border-border bg-background px-2.5 py-1 text-[12px] outline-none"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="likes">Most likes</option>
            <option value="reach">Most reach</option>
            <option value="comments">Most comments</option>
          </select>
          {(["grid", "list"] as ViewMode[]).map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-border",
                view === v ? "bg-secondary text-foreground" : "bg-background text-muted-foreground",
              )}
            >
              {v === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}
            </button>
          ))}
        </div>
      </div>

      {/* Results / bulk bar */}
      <div className="flex flex-shrink-0 items-center gap-2.5 border-border border-b bg-background px-7 py-2">
        <span className="text-[12px] font-medium text-muted-foreground">
          {filtered.length} post{filtered.length === 1 ? "" : "s"}
          {selected.size > 0 ? (
            <span className="ml-2" style={{ color: HEART_ACTIVE }}>
              · {selected.size} selected
            </span>
          ) : null}
        </span>
        {selected.size > 0 ? (
          <div className="ml-2 flex gap-1.5">
            <Button variant="outline" size="sm">
              Reschedule
            </Button>
            <Button variant="outline" size="sm">
              Duplicate
            </Button>
            <Button variant="outline" size="sm" className="text-destructive">
              Delete
            </Button>
          </div>
        ) : null}
        {selected.size > 0 ? (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        ) : null}
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto px-7 py-5">
        {filtered.length === 0 ? (
          <div className="py-15 text-center text-[14px] text-muted-foreground">
            No posts match your filters.
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-3 gap-3.5">
            {filtered.map((post) => (
              <PostGridCard
                key={post.id}
                post={post}
                selected={selected.has(post.id)}
                onSelect={() => toggleSelect(post.id)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {filtered.map((post, i) => (
              <PostListRow
                key={post.id}
                post={post}
                selected={selected.has(post.id)}
                onSelect={() => toggleSelect(post.id)}
                isLast={i === filtered.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChipBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-0.5 font-medium text-[12px] whitespace-nowrap transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PostGridCard({
  post,
  selected,
  onSelect,
}: {
  post: MockPost;
  selected: boolean;
  onSelect: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [activePlatform, setActivePlatform] = useState<Platform>(post.platforms[0]!);
  const meta = PLATFORM_CONSTRAINTS[activePlatform];

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg bg-card transition-shadow",
        selected ? "border-2" : "border border-border",
      )}
      style={
        selected
          ? {
              borderColor: "oklch(0.74 0.16 275)",
              boxShadow: "0 0 0 3px oklch(0.74 0.16 275 / 20%)",
            }
          : undefined
      }
    >
      {/* Select checkbox */}
      <button
        type="button"
        onClick={onSelect}
        className="absolute top-2 right-2 z-10 flex h-[18px] w-[18px] items-center justify-center rounded"
        style={{
          background: selected ? "oklch(0.62 0.20 275)" : "oklch(1 0 0 / 80%)",
          border: selected ? "none" : "1.5px solid oklch(0.7 0 0)",
        }}
      >
        {selected ? <Check size={10} className="text-white" strokeWidth={3} /> : null}
      </button>

      {/* Image */}
      <div className="relative flex h-[100px] items-center justify-center bg-secondary">
        <ImageIcon size={24} className="text-border" />
        <div className="absolute top-2 left-2">
          <StatusBadge status={post.status} />
        </div>
      </div>

      {/* Platform tabs */}
      {post.platforms.length > 1 ? (
        <div className="flex flex-wrap gap-1 px-2.5 pt-2">
          {post.platforms.map((plat) => {
            const m = PLATFORM_CONSTRAINTS[plat];
            const active = activePlatform === plat;
            return (
              <button
                type="button"
                key={plat}
                onClick={() => setActivePlatform(plat)}
                className="flex items-center gap-1 rounded-full px-1.5 py-px font-medium text-[10px] transition-all"
                style={{
                  border: active ? `1.5px solid ${m.color}50` : "1.5px solid var(--border)",
                  background: active ? m.chipBg : "transparent",
                  color: active ? m.chipText : "var(--muted-foreground)",
                }}
              >
                <PlatformIcon platform={plat} size={11} />
                {m.name}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-1 px-2.5 pt-2">
          <PlatformIcon platform={post.platforms[0]!} size={12} />
          <span
            className="rounded-full px-1.5 py-px font-medium text-[10px]"
            style={{ background: meta.chipBg, color: meta.chipText }}
          >
            {meta.name}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 px-2.5 pt-2 pb-2.5">
        <p className="line-clamp-2 text-[12px] leading-snug text-foreground">{post.content}</p>
        {post.date ? (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={10} />
            {post.date} · {post.time}
          </div>
        ) : null}
        {post.status === "published" ? (
          <div className="flex gap-2.5 border-border border-t pt-1">
            {[
              { v: localLikes, l: "Likes" },
              { v: post.comments, l: "Comments" },
              { v: post.reach.toLocaleString(), l: "Reach" },
            ].map((s) => (
              <div key={s.l} className="flex-1">
                <div className="text-[12px] font-bold text-foreground">{s.v}</div>
                <div className="text-[9px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="-mx-1 flex items-center gap-0 pt-0.5">
          <button
            type="button"
            onClick={() => {
              setLiked(!liked);
              setLocalLikes((n) => (liked ? n - 1 : n + 1));
            }}
            className="flex items-center gap-1 rounded-sm px-1.5 py-px text-[11px] font-medium"
            style={{ color: liked ? HEART_ACTIVE : "var(--muted-foreground)" }}
          >
            <Heart
              size={11}
              fill={liked ? HEART_ACTIVE : "none"}
              stroke={liked ? HEART_ACTIVE : "currentColor"}
            />
            Like
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-sm px-1.5 py-px text-[11px] text-muted-foreground"
          >
            <MessageCircle size={11} />
            Comment
          </button>
          <div className="flex-1" />
          <button type="button" className="rounded-sm px-1 py-px text-muted-foreground">
            <MoreHorizontal size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PostListRow({
  post,
  selected,
  onSelect,
  isLast,
}: {
  post: MockPost;
  selected: boolean;
  onSelect: () => void;
  isLast: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors",
        !isLast && "border-border border-b",
        selected ? "bg-secondary" : "bg-transparent",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm"
        style={{
          border: selected ? "none" : "1.5px solid var(--border)",
          background: selected ? "oklch(0.62 0.20 275)" : "transparent",
        }}
      >
        {selected ? <Check size={9} className="text-white" strokeWidth={3} /> : null}
      </button>
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-secondary">
        <ImageIcon size={16} className="text-border" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 truncate text-[13px] text-foreground">{post.content}</div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {post.platforms.map((p) => (
              <PlatformIcon key={p} platform={p} size={13} />
            ))}
          </div>
          <StatusBadge status={post.status} />
          {post.date ? (
            <span className="text-[11px] text-muted-foreground">
              {post.date} · {post.time}
            </span>
          ) : null}
        </div>
      </div>
      {post.status === "published" ? (
        <div className="flex flex-shrink-0 gap-4">
          {[
            { v: localLikes, l: "Likes" },
            { v: post.comments, l: "Comments" },
            { v: post.reach.toLocaleString(), l: "Reach" },
          ].map((s) => (
            <div key={s.l} className="min-w-[44px] text-center">
              <div className="text-[13px] font-semibold text-foreground">{s.v}</div>
              <div className="text-[10px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-shrink-0 gap-1">
        <button
          type="button"
          onClick={() => {
            setLiked(!liked);
            setLocalLikes((n) => (liked ? n - 1 : n + 1));
          }}
          className="rounded-sm px-1.5 py-1"
          style={{ color: liked ? HEART_ACTIVE : "var(--muted-foreground)" }}
        >
          <Heart
            size={12}
            fill={liked ? HEART_ACTIVE : "none"}
            stroke={liked ? HEART_ACTIVE : "currentColor"}
          />
        </button>
        <button type="button" className="rounded-sm px-1.5 py-1 text-muted-foreground">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
