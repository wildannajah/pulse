/**
 * Per-platform constraints from PRD §5.
 *
 * Single source of truth. Consumed by:
 *   - apps/web composer (client-side validation, char counter)
 *   - apps/api publish workflow (server-side pre-flight before dispatch)
 *   - apps/web display chips (color tokens for platform badges)
 *
 * Visual fields (color, chipBg, chipText) are encoded as data so the backend
 * can include them in tRPC responses without per-call lookups; the backend
 * itself doesn't render anything with them.
 */

import { PLATFORM_LIST, type Platform } from "./platform";

export type { Platform };
export { PLATFORM_LIST };

export type MediaConstraints = {
  /** Max number of images per post (null = unlimited / not applicable) */
  maxImages: number | null;
  /** Max video duration in seconds (null = no limit / not applicable) */
  maxVideoSeconds: number | null;
  /** Whether video uploads are supported */
  supportsVideo: boolean;
  /** Required aspect ratio (e.g. "9:16" for vertical-only platforms) — null = any */
  requiredAspectRatio: string | null;
};

export type PlatformConstraint = {
  platform: Platform;
  /** Display name for UI */
  name: string;
  /** Brand color — accent only, never large fills (per CLAUDE.md) */
  color: string;
  /** Soft tint background for chips */
  chipBg: string;
  /** Foreground colour for text on chipBg */
  chipText: string;
  /** Maximum caption/post character length */
  charLimit: number;
  /** Maximum hashtags allowed per post (null = no specific limit) */
  hashtagLimit: number | null;
  /** Media constraints */
  media: MediaConstraints;
  /** Approximate publish requests allowed per day per token (null = generous / not specified) */
  publishRateLimitPerDay: number | null;
  /** Notes / quirks worth surfacing to UI or operators */
  notes: string[];
};

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraint> = {
  instagram: {
    platform: "instagram",
    name: "Instagram",
    color: "#E1306C",
    chipBg: "#fce7ef",
    chipText: "#c1185a",
    charLimit: 2200,
    hashtagLimit: 30,
    media: {
      maxImages: 10, // carousel
      maxVideoSeconds: 15 * 60,
      supportsVideo: true,
      requiredAspectRatio: null,
    },
    publishRateLimitPerDay: null,
    notes: ["Publishing requires a connected Facebook Business Page", "Reels: max 15 minutes, MP4"],
  },
  twitter: {
    platform: "twitter",
    name: "Twitter/X",
    color: "#000000",
    chipBg: "#f1f1f1",
    chipText: "#111111",
    charLimit: 280,
    hashtagLimit: null,
    media: {
      maxImages: 4,
      maxVideoSeconds: 140,
      supportsVideo: true,
      requiredAspectRatio: null,
    },
    publishRateLimitPerDay: null,
    notes: ["Requires Elevated or Pro API tier for full posting features"],
  },
  facebook: {
    platform: "facebook",
    name: "Facebook",
    color: "#1877F2",
    chipBg: "#e8f0fe",
    chipText: "#1565c0",
    charLimit: 63206,
    hashtagLimit: null,
    media: {
      maxImages: null,
      maxVideoSeconds: 4 * 60 * 60,
      supportsVideo: true,
      requiredAspectRatio: null,
    },
    publishRateLimitPerDay: null,
    notes: ["Page publishing requires Page Admin or Editor role"],
  },
  linkedin: {
    platform: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    chipBg: "#e1f0fa",
    chipText: "#0a4f8c",
    charLimit: 3000,
    hashtagLimit: null,
    media: {
      maxImages: null,
      maxVideoSeconds: 10 * 60,
      supportsVideo: true,
      requiredAspectRatio: null,
    },
    publishRateLimitPerDay: 100,
    notes: [
      "100 requests per day per member token",
      "Personal profile + Company Pages have separate OAuth flows",
    ],
  },
  threads: {
    platform: "threads",
    name: "Threads",
    color: "#000000",
    chipBg: "#f5f5f5",
    chipText: "#333333",
    charLimit: 500,
    hashtagLimit: null,
    media: {
      maxImages: null,
      maxVideoSeconds: null,
      supportsVideo: true,
      requiredAspectRatio: null,
    },
    publishRateLimitPerDay: null,
    notes: ["Threads API is in early access — apply via Meta for Developers"],
  },
  tiktok: {
    platform: "tiktok",
    name: "TikTok",
    color: "#010101",
    chipBg: "#f5f5f5",
    chipText: "#333333",
    charLimit: 2200,
    hashtagLimit: null,
    media: {
      maxImages: 0,
      maxVideoSeconds: 10 * 60,
      supportsVideo: true,
      requiredAspectRatio: "9:16",
    },
    publishRateLimitPerDay: null,
    notes: [
      "Video-only; requires Content Posting API access",
      "TikTok API does not support DM access — inbox limited to comments",
    ],
  },
  youtube: {
    platform: "youtube",
    name: "YouTube",
    color: "#FF0000",
    chipBg: "#fce8e8",
    chipText: "#c62828",
    charLimit: 5000,
    hashtagLimit: null,
    media: {
      maxImages: null,
      maxVideoSeconds: null,
      supportsVideo: true,
      requiredAspectRatio: null,
    },
    publishRateLimitPerDay: null,
    notes: [
      "Upload requires OAuth with youtube.upload scope",
      "Shorts: vertical video, max 60 seconds",
    ],
  },
};

/** Validate a post's text against a single platform's constraints */
export function validateTextForPlatform(
  text: string,
  platform: Platform,
): { ok: true } | { ok: false; reason: string } {
  const c = PLATFORM_CONSTRAINTS[platform];
  if (text.length > c.charLimit) {
    return {
      ok: false,
      reason: `Exceeds ${c.name} character limit (${text.length}/${c.charLimit})`,
    };
  }
  if (c.hashtagLimit !== null) {
    const tagCount = (text.match(/#\w+/g) ?? []).length;
    if (tagCount > c.hashtagLimit) {
      return {
        ok: false,
        reason: `Exceeds ${c.name} hashtag limit (${tagCount}/${c.hashtagLimit})`,
      };
    }
  }
  return { ok: true };
}
