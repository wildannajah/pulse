"use client";

import { type Platform, PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { Clock, Hash, Image as ImageIcon, Send, Sparkles } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MOCK_BRANDS } from "@/lib/mock-data";
import { PLATFORM_LIST, PLATFORM_META } from "@/lib/platform-meta";

const SAMPLE_GENERATED =
  "Exciting news from the Acme team! We've been working hard behind the scenes and can't wait to share what's coming next. Stay tuned for a big announcement dropping this week. 🚀 #AcmeCorp #ProductLaunch";

export default function ComposerPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["instagram", "twitter"]);
  const [content, setContent] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<Platform>("instagram");
  const [aiLoading, setAiLoading] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("2026-04-30");
  const [scheduleTime, setScheduleTime] = useState("10:00");

  const brand = MOCK_BRANDS[0]!;
  const activeMeta = PLATFORM_META[previewPlatform];
  const charCount = content.length;
  const overLimit = charCount > activeMeta.charLimit;

  const togglePlatform = (key: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (!prev.includes(key)) setPreviewPlatform(key);
      return next;
    });
  };

  const handleAi = () => {
    setAiLoading(true);
    setTimeout(() => {
      setContent(SAMPLE_GENERATED);
      setAiLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Composer">
        <Button variant="outline" size="sm">
          <Clock size={13} className="text-muted-foreground" />
          Drafts
        </Button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left — Editor */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto border-border border-r p-6">
          {/* Platform selector */}
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Publish to
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_LIST.map((key) => {
                const m = PLATFORM_META[key];
                const on = selectedPlatforms.includes(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => togglePlatform(key)}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-[12px] transition-all"
                    style={{
                      background: on ? m.chipBg : "var(--secondary)",
                      color: on ? m.chipText : "var(--muted-foreground)",
                      outline: on ? `2px solid ${m.color}30` : "none",
                    }}
                  >
                    <PlatformIcon platform={key} size={14} />
                    {m.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Editor */}
          <section className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post…"
              className="min-h-[140px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-ring/40"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  <ImageIcon size={14} /> Media
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  <Hash size={14} /> Hashtags
                </button>
                <button
                  type="button"
                  onClick={handleAi}
                  className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
                  style={aiLoading ? { background: "var(--secondary)" } : undefined}
                >
                  <Sparkles size={14} />
                  {aiLoading ? "Generating…" : "AI Assist"}
                </button>
              </div>
              <span
                className="font-mono text-[11px]"
                style={{ color: overLimit ? "var(--destructive)" : "var(--muted-foreground)" }}
              >
                {charCount}/{activeMeta.charLimit}
              </span>
            </div>
          </section>

          {/* Schedule */}
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Schedule
              </div>
              <button
                type="button"
                onClick={() => setScheduled((v) => !v)}
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: scheduled ? "oklch(0.45 0.15 70)" : "var(--muted-foreground)" }}
              >
                <span
                  className="relative h-4 w-7 rounded-full transition-colors"
                  style={{ background: scheduled ? "oklch(0.75 0.15 70)" : "var(--border)" }}
                >
                  <span
                    className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all"
                    style={{ left: scheduled ? "14px" : "2px" }}
                  />
                </span>
                {scheduled ? "Scheduled" : "Post now"}
              </button>
            </div>
            {scheduled ? (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] outline-none"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-24 rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] outline-none"
                />
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1">
                Save draft
              </Button>
              <Button className="flex-[2]">
                <Send size={13} />
                {scheduled ? "Schedule post" : "Publish now"}
              </Button>
            </div>
          </section>
        </div>

        {/* Right — Preview */}
        <div className="flex w-[320px] flex-shrink-0 flex-col gap-3 overflow-y-auto p-6">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedPlatforms.map((key) => {
              const m = PLATFORM_META[key];
              const active = previewPlatform === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setPreviewPlatform(key)}
                  className="rounded-sm px-2.5 py-1 font-medium text-[11px] transition-all"
                  style={{
                    background: active ? m.chipBg : "var(--secondary)",
                    color: active ? m.chipText : "var(--muted-foreground)",
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          {selectedPlatforms.length > 0 ? (
            <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: brand.color }}
                >
                  {brand.initials}
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{brand.name}</div>
                  <div className="text-[11px] text-muted-foreground">{activeMeta.name}</div>
                </div>
              </div>
              <div className="flex h-[120px] items-center justify-center rounded-md bg-secondary">
                <ImageIcon size={24} className="text-muted-foreground" />
              </div>
              <p className="m-0 min-h-10 text-[13px] leading-relaxed text-foreground">
                {content || (
                  <span className="text-muted-foreground">Your post content will appear here…</span>
                )}
              </p>
              <div className="flex gap-3.5 border-border border-t pt-1 text-[11px] font-medium text-muted-foreground">
                <span>Like</span>
                <span>Comment</span>
                <span>Share</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary p-6 text-center text-[13px] text-muted-foreground">
              Select at least one platform to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
