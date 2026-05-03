import type { Platform } from "@pulse/ui/icons/platform-icon";

import { PLATFORM_META } from "@/lib/platform-meta";

type PlatformBadgeProps = {
  platform: Platform;
};

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-[11px]"
      style={{ background: meta.chipBg, color: meta.chipText }}
    >
      {meta.name}
    </span>
  );
}
