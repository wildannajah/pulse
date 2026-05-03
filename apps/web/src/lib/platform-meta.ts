import type { Platform } from "@pulse/ui/icons/platform-icon";

export type PlatformMeta = {
  platform: Platform;
  name: string;
  /** Hex used for accent borders, dot indicators, chart strokes — never large fills */
  color: string;
  /** Tailwind-friendly soft tint background for chips */
  chipBg: string;
  /** Foreground colour for text on chipBg */
  chipText: string;
  /** Character limit for posts on this platform */
  charLimit: number;
};

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  instagram: {
    platform: "instagram",
    name: "Instagram",
    color: "#E1306C",
    chipBg: "#fce7ef",
    chipText: "#c1185a",
    charLimit: 2200,
  },
  twitter: {
    platform: "twitter",
    name: "Twitter/X",
    color: "#000000",
    chipBg: "#f1f1f1",
    chipText: "#111111",
    charLimit: 280,
  },
  facebook: {
    platform: "facebook",
    name: "Facebook",
    color: "#1877F2",
    chipBg: "#e8f0fe",
    chipText: "#1565c0",
    charLimit: 63206,
  },
  linkedin: {
    platform: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    chipBg: "#e1f0fa",
    chipText: "#0a4f8c",
    charLimit: 3000,
  },
  threads: {
    platform: "threads",
    name: "Threads",
    color: "#000000",
    chipBg: "#f5f5f5",
    chipText: "#333333",
    charLimit: 500,
  },
  tiktok: {
    platform: "tiktok",
    name: "TikTok",
    color: "#010101",
    chipBg: "#f5f5f5",
    chipText: "#333333",
    charLimit: 2200,
  },
  youtube: {
    platform: "youtube",
    name: "YouTube",
    color: "#FF0000",
    chipBg: "#fce8e8",
    chipText: "#c62828",
    charLimit: 5000,
  },
};

export const PLATFORM_LIST: readonly Platform[] = [
  "instagram",
  "twitter",
  "facebook",
  "linkedin",
  "threads",
  "tiktok",
  "youtube",
] as const;
