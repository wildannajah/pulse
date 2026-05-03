import type { SVGProps } from "react";

export type Platform =
  | "instagram"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "threads"
  | "tiktok"
  | "youtube";

export type PlatformIconProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "xmlns"> & {
  platform: Platform;
  size?: number | string;
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export const PLATFORMS: readonly Platform[] = [
  "instagram",
  "twitter",
  "facebook",
  "linkedin",
  "threads",
  "tiktok",
  "youtube",
] as const;

export function PlatformIcon({ platform, size = 24, ...rest }: PlatformIconProps) {
  const label = PLATFORM_LABELS[platform];
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    role: "img" as const,
    "aria-label": label,
    ...rest,
  };

  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <title>{label}</title>
          <defs>
            <radialGradient id="pulse-ig-grad" cx="30%" cy="107%" r="150%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="5" fill="url(#pulse-ig-grad)" />
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8" />
          <circle cx="17" cy="7" r="1.2" fill="white" />
        </svg>
      );

    case "twitter":
      return (
        <svg {...common}>
          <title>{label}</title>
          <rect width="24" height="24" rx="5" fill="#000" />
          <path
            d="M13.5 10.9 18.8 5h-1.3l-4.6 5.2L9 5H5l5.6 7.9L5 19h1.3l4.9-5.6 3.9 5.6H19l-5.5-8.1zm-1.7 2-.6-.8L6.9 6H8.5l3.6 5 .6.8 4.7 6.5h-1.6l-3.9-5.4z"
            fill="white"
          />
        </svg>
      );

    case "facebook":
      return (
        <svg {...common}>
          <title>{label}</title>
          <rect width="24" height="24" rx="5" fill="#1877F2" />
          <path
            d="M15.5 8h-2v-1c0-.55.45-1 1-1h1V4h-1.5C12.67 4 11.5 5.17 11.5 6.5V8H10v2h1.5v6h2V10H15l.5-2z"
            fill="white"
          />
        </svg>
      );

    case "linkedin":
      return (
        <svg {...common}>
          <title>{label}</title>
          <rect width="24" height="24" rx="4" fill="#0A66C2" />
          <path
            d="M7.2 9.6h2.4v7.8H7.2V9.6zm1.2-3.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zm3.6 3.6h2.3v1.07h.03c.32-.6 1.1-1.23 2.27-1.23 2.42 0 2.87 1.6 2.87 3.67V17.4h-2.4v-3.24c0-.77-.01-1.77-1.08-1.77-1.08 0-1.24.84-1.24 1.71V17.4H12V9.6z"
            fill="white"
          />
        </svg>
      );

    case "threads":
      return (
        <svg {...common}>
          <title>{label}</title>
          <rect width="24" height="24" rx="5" fill="#000" />
          <path
            d="M16.2 11.3c-.1-.05-.22-.1-.34-.14a5.5 5.5 0 0 0-.12-3.14C15.04 6.14 13.6 5 12 5c-1.52 0-2.76.88-3.5 2.32-.1.2-.02.44.17.54.2.1.44.02.54-.17C9.83 6.56 10.8 5.8 12 5.8c1.28 0 2.44.9 2.98 2.32.14.38.22.78.22 1.2 0 .04 0 .08-.01.12a7.4 7.4 0 0 0-1.2-.1c-1.7 0-3.1.8-3.52 2.08-.15.46-.16.98.02 1.46.28.77 1 1.28 1.97 1.36.06 0 .12.01.18.01 1.6 0 2.68-.88 3-2.46a3.1 3.1 0 0 1 .34.23c.5.4.76.94.76 1.6 0 1.6-1.5 2.78-3.74 2.78-2.52 0-4.24-1.7-4.24-4.14 0-2.42 1.84-4.26 4.24-4.26.3 0 .59.03.87.08.22.04.43-.1.47-.32.04-.22-.1-.43-.32-.47A5.7 5.7 0 0 0 12 7.6c-2.78 0-5.04 2.2-5.04 5.06 0 2.86 2.14 4.94 5.04 4.94 2.7 0 4.54-1.52 4.54-3.58 0-.9-.36-1.68-1-2.22zm-3.6 2.92c-.74-.06-1.2-.42-1.38-.9-.1-.28-.1-.62 0-.9.28-.82 1.38-1.35 2.72-1.35.36 0 .7.04 1.02.1-.26 1.46-1.1 2.1-2.36 2.05z"
            fill="white"
          />
        </svg>
      );

    case "tiktok":
      return (
        <svg {...common}>
          <title>{label}</title>
          <rect width="24" height="24" rx="5" fill="#010101" />
          <path
            d="M17 8.3a3.7 3.7 0 0 1-3.7-3.7h-1.9v9.8a1.7 1.7 0 1 1-1.1-1.6V11a3.6 3.6 0 1 0 3 3.5V9.8A5.6 5.6 0 0 0 17 10V8.3z"
            fill="white"
          />
          <path
            d="M17 8.3a3.7 3.7 0 0 1-3.7-3.7h-1.9v9.8a1.7 1.7 0 1 1-1.1-1.6V11a3.6 3.6 0 1 0 3 3.5V9.8A5.6 5.6 0 0 0 17 10V8.3z"
            fill="none"
            stroke="#69C9D0"
            strokeWidth="0.4"
            opacity="0.7"
          />
        </svg>
      );

    case "youtube":
      return (
        <svg {...common}>
          <title>{label}</title>
          <rect width="24" height="24" rx="5" fill="#FF0000" />
          <path
            d="M19.6 8.2a2 2 0 0 0-1.4-1.4C16.8 6.5 12 6.5 12 6.5s-4.8 0-6.2.4A2 2 0 0 0 4.4 8.2 20 20 0 0 0 4 12a20 20 0 0 0 .4 3.8 2 2 0 0 0 1.4 1.4c1.4.4 6.2.4 6.2.4s4.8 0 6.2-.4a2 2 0 0 0 1.4-1.4A20 20 0 0 0 20 12a20 20 0 0 0-.4-3.8z"
            fill="white"
            opacity="0.9"
          />
          <path d="M10 14.5l4-2.5-4-2.5v5z" fill="#FF0000" />
        </svg>
      );
  }
}
