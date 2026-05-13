/**
 * Foundational `Platform` type.
 *
 * Lives in @pulse/types because every layer of the system references it:
 * the UI for icons + chips, the API for OAuth + scoping, the workers for
 * publish dispatch, the schema enum.
 *
 * Stay in sync with the `Platform` Prisma enum in apps/api/prisma/schema.prisma.
 */

import { z } from "zod";

export type Platform =
  | "instagram"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "threads"
  | "tiktok"
  | "youtube";

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube",
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

/** Zod enum for validating Platform values — source of truth for tRPC procedure inputs. */
export const PlatformEnum = z.enum([
  "instagram",
  "twitter",
  "facebook",
  "linkedin",
  "threads",
  "tiktok",
  "youtube",
]);
