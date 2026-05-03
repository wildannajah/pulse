"use client";

import { type Platform, PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { useState } from "react";

import { PageHeader } from "@/components/app/page-header";
import { MOCK_ANALYTICS } from "@/lib/mock-data";
import { PLATFORM_LIST, PLATFORM_META } from "@/lib/platform-meta";
import { cn } from "@/lib/utils/cn";

type DateRange = "7d" | "30d" | "90d";

const RANGES: DateRange[] = ["7d", "30d", "90d"];
const CHART_LABELS = ["Apr 1", "Apr 5", "Apr 10", "Apr 15", "Apr 20", "Apr 24", "Apr 28"];

export default function AnalyticsPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const data = MOCK_ANALYTICS[activePlatform];
  const meta = PLATFORM_META[activePlatform];

  const cards = [
    {
      label: "Followers",
      value: data.followers.toLocaleString(),
      delta: "+3.4%",
      sparkColor: "var(--foreground)",
    },
    {
      label: "Impressions",
      value: `${(data.impressions / 1000).toFixed(1)}k`,
      delta: "+12.1%",
      sparkColor: "oklch(0.55 0.15 240)",
    },
    {
      label: "Reach",
      value: `${(data.reach / 1000).toFixed(1)}k`,
      delta: "+8.7%",
      sparkColor: "oklch(0.55 0.15 150)",
    },
    {
      label: "Engagement",
      value: `${data.engagement}%`,
      delta: "+0.4pp",
      sparkColor: "oklch(0.55 0.15 70)",
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Analytics">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                "rounded-sm border border-border px-2.5 py-1 font-medium text-[12px]",
                dateRange === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
        {/* Platform tabs */}
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_LIST.map((key) => {
            const m = PLATFORM_META[key];
            const active = activePlatform === key;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setActivePlatform(key)}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-medium text-[12px]"
                style={{
                  background: active ? m.chipBg : "var(--card)",
                  color: active ? m.chipText : "var(--muted-foreground)",
                  borderColor: active ? `${m.color}40` : "var(--border)",
                }}
              >
                <PlatformIcon platform={key} size={14} />
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-card px-5 py-4">
              <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{c.label}</div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[24px] font-bold leading-none tracking-tight">{c.value}</div>
                  <div
                    className="mt-1 text-[11px] font-medium"
                    style={{ color: "oklch(0.5 0.18 150)" }}
                  >
                    ↑ {c.delta}
                  </div>
                </div>
                <Sparkline values={data.growth} color={c.sparkColor} />
              </div>
            </div>
          ))}
        </div>

        {/* Follower growth chart */}
        <div className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="mb-4 text-[13px] font-semibold">Follower growth — {meta.name}</div>
          <FullLineChart values={data.growth} color={meta.color} labels={CHART_LABELS} />
        </div>

        {/* Top posts */}
        <div className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="mb-3.5 text-[13px] font-semibold">Top posts</div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Post", "Likes", "Comments", "Reach"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "border-border border-b px-2 pt-1.5 pb-2.5 font-semibold text-[11px] text-muted-foreground",
                      h === "Post" ? "text-left" : "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.topPosts.map((post, i) => (
                <tr
                  key={post.content}
                  className={i < data.topPosts.length - 1 ? "border-border border-b" : ""}
                >
                  <td className="max-w-[260px] truncate px-2 py-2.5 text-foreground">
                    {post.content}
                  </td>
                  <td className="px-2 py-2.5 text-right font-medium text-foreground">
                    {post.likes.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right font-medium text-foreground">
                    {post.comments}
                  </td>
                  <td className="px-2 py-2.5 text-right font-medium text-foreground">
                    {post.reach.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 120;
  const H = 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pad = 4;
  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v - min) / range) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="block"
      role="img"
      aria-label="Sparkline"
    >
      <title>Sparkline</title>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FullLineChart({
  values,
  color,
  labels,
}: {
  values: number[];
  color: string;
  labels: string[];
}) {
  const W = 600;
  const H = 100;
  const pad = 16;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return { x, y };
  });
  const lineStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const firstX = pts[0]?.x ?? 0;
  const lastX = pts[pts.length - 1]?.x ?? 0;
  const areaPath = `M ${pts[0]?.x.toFixed(1)},${pts[0]?.y.toFixed(1)} ${pts
    .slice(1)
    .map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ")} L ${lastX.toFixed(1)},${H} L ${firstX.toFixed(1)},${H} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H + 20}`}
      className="block overflow-visible"
      role="img"
      aria-label="Follower growth chart"
    >
      <title>Follower growth chart</title>
      <defs>
        <linearGradient id="pulse-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#pulse-area-grad)" />
      <polyline
        points={lineStr}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p) => (
        <circle
          key={`${p.x.toFixed(2)}-${p.y.toFixed(2)}`}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      ))}
      {labels.map((l, i) => {
        const x = pad + (i / (labels.length - 1)) * (W - pad * 2);
        return (
          <text key={l} x={x} y={H + 16} textAnchor="middle" fontSize="10" fill="oklch(0.556 0 0)">
            {l}
          </text>
        );
      })}
    </svg>
  );
}
