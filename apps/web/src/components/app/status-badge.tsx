import type { PostStatus } from "@/lib/mock-data";

type StatusBadgeProps = {
  status: PostStatus;
};

const STATUS_STYLES: Record<PostStatus, { bg: string; fg: string; label: string }> = {
  published: { bg: "oklch(0.92 0.08 150)", fg: "oklch(0.35 0.15 150)", label: "Published" },
  scheduled: { bg: "oklch(0.95 0.08 70)", fg: "oklch(0.45 0.15 70)", label: "Scheduled" },
  draft: { bg: "oklch(0.97 0 0)", fg: "oklch(0.556 0 0)", label: "Draft" },
  failed: { bg: "oklch(0.577 0.245 27)", fg: "oklch(1 0 0)", label: "Failed" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[11px]"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="inline-block h-[5px] w-[5px] flex-shrink-0 rounded-full"
        style={{ background: s.fg }}
      />
      {s.label}
    </span>
  );
}
