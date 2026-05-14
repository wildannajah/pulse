import { PLATFORM_LABELS, PLATFORM_LIST, type Platform } from "@pulse/types/platform";
import type { IconType } from "react-icons";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaThreads,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

// Re-export for consumers that have been importing Platform from this module
export type { Platform };
export { PLATFORM_LABELS };
/** @deprecated import `PLATFORM_LIST` from `@pulse/types/platform` instead */
export const PLATFORMS = PLATFORM_LIST;

export type PlatformIconProps = {
  platform: Platform;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

const PLATFORM_ICON_MAP: Record<Platform, IconType> = {
  instagram: FaInstagram,
  twitter: FaXTwitter,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  threads: FaThreads,
  tiktok: FaTiktok,
  youtube: FaYoutube,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "#E1306C",
  twitter: "#000000",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  threads: "#000000",
  tiktok: "#010101",
  youtube: "#FF0000",
};

export function PlatformIcon({ platform, size = 24, className, style }: PlatformIconProps) {
  const Icon = PLATFORM_ICON_MAP[platform];
  return (
    <Icon
      size={size}
      color={PLATFORM_COLORS[platform]}
      className={className}
      style={style}
      title={PLATFORM_LABELS[platform]}
    />
  );
}
