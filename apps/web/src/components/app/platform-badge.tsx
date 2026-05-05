import { PLATFORM_CONSTRAINTS } from "@pulse/types/platform-constraints";
import type { Platform } from "@pulse/ui/icons/platform-icon";

type PlatformBadgeProps = {
  platform: Platform;
};

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const meta = PLATFORM_CONSTRAINTS[platform];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-[11px]"
      style={{ background: meta.chipBg, color: meta.chipText }}
    >
      {meta.name}
    </span>
  );
}
