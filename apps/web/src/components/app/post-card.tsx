"use client";

import { PLATFORM_CONSTRAINTS } from "@pulse/types/platform-constraints";
import type { PostStatus } from "@pulse/types/post-status";
import { type Platform, PlatformIcon } from "@pulse/ui/icons/platform-icon";
import {
  Bookmark,
  Clock,
  Hash,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

import { StatusBadge } from "./status-badge";

type PostDisplayItem = {
  id: string;
  content: string;
  platforms: Platform[];
  status: PostStatus;
  scheduledAt?: string | null;
  likes?: number;
  comments?: number;
  reach?: number;
};

type PostCardProps = {
  post: PostDisplayItem;
};

const HEART_ACTIVE = "oklch(0.52 0.22 275)";

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [localLikes, setLocalLikes] = useState(post.likes ?? 0);
  const [activePlatform, setActivePlatform] = useState<Platform>(post.platforms[0] ?? "twitter");

  const meta = PLATFORM_CONSTRAINTS[activePlatform];

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Image placeholder */}
      <div className="relative flex h-[120px] items-center justify-center bg-secondary">
        <ImageIcon size={28} className="text-border" />
        <div className="absolute top-2 left-2">
          <StatusBadge status={post.status} />
        </div>
      </div>

      {/* Platform switcher */}
      {post.platforms.length > 1 ? (
        <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
          {post.platforms.map((plat) => {
            const m = PLATFORM_CONSTRAINTS[plat];
            const active = activePlatform === plat;
            return (
              <button
                type="button"
                key={plat}
                onClick={() => setActivePlatform(plat)}
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-[11px] transition-all"
                style={{
                  border: active ? `1.5px solid ${m.color}60` : "1.5px solid var(--border)",
                  background: active ? m.chipBg : "transparent",
                  color: active ? m.chipText : "var(--muted-foreground)",
                }}
              >
                <PlatformIcon platform={plat} size={13} />
                {m.name}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 pt-2.5">
          <PlatformIcon platform={post.platforms[0] ?? "twitter"} size={14} />
          <span
            className="rounded-full px-2 py-0.5 font-medium text-[11px]"
            style={{ background: meta.chipBg, color: meta.chipText }}
          >
            {meta.name}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-3.5 py-2.5">
        <p className="line-clamp-2 text-[13px] leading-snug text-foreground">{post.content}</p>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          {post.scheduledAt ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={11} />
              {new Date(post.scheduledAt).toLocaleDateString()}
            </div>
          ) : (
            <div />
          )}
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {post.content.length}/{meta.charLimit}
          </span>
        </div>

        {/* Stats row — published only */}
        {post.status === "published" ? (
          <div className="flex gap-3 border-y border-border py-2">
            {[
              { icon: TrendingUp, val: (post.reach ?? 0).toLocaleString(), label: "Reach" },
              { icon: UserIcon, val: localLikes.toLocaleString(), label: "Likes" },
              { icon: Hash, val: (post.comments ?? 0).toString(), label: "Comments" },
            ].map((s) => (
              <div key={s.label} className="flex-1 text-center">
                <div className="text-[13px] font-bold tracking-tight text-foreground">{s.val}</div>
                <div className="mt-px text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Action bar */}
        <div className="-mx-1 flex items-center gap-0">
          <ActionBtn
            active={liked}
            onClick={() => {
              setLiked((v) => !v);
              setLocalLikes((n) => (liked ? n - 1 : n + 1));
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={liked ? HEART_ACTIVE : "none"}
              stroke={liked ? HEART_ACTIVE : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <title>Like</title>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {localLikes > 0 ? localLikes : "Like"}
          </ActionBtn>
          <ActionBtn active={showComment} onClick={() => setShowComment((v) => !v)}>
            <MessageCircle size={13} />
            Comment
          </ActionBtn>
          <ActionBtn active={false} onClick={() => {}}>
            <Share2 size={13} />
            Share
          </ActionBtn>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setBookmarked((v) => !v)}
            className={cn(
              "rounded-sm px-1.5 py-1 transition-colors",
              bookmarked ? "" : "text-muted-foreground hover:text-foreground",
            )}
            style={bookmarked ? { color: HEART_ACTIVE } : undefined}
          >
            <Bookmark size={13} fill={bookmarked ? HEART_ACTIVE : "none"} />
          </button>
          <button
            type="button"
            className="rounded-sm px-1.5 py-1 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal size={13} />
          </button>
        </div>

        {showComment ? (
          <div className="flex items-center gap-1.5 border-t border-border pt-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-md border border-border bg-secondary px-2.5 py-1 text-[12px] text-foreground outline-none"
            />
            <button
              type="button"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
            >
              <Send size={12} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActionBtn({
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
        "flex items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] font-medium transition-colors",
        active ? "" : "text-muted-foreground hover:text-foreground",
      )}
      style={active ? { color: HEART_ACTIVE } : undefined}
    >
      {children}
    </button>
  );
}
