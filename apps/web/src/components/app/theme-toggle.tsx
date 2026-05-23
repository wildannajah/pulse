"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

type Mode = "light" | "dark" | "system";

const MODES: { id: Mode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
];

type ThemeToggleProps = {
  /** "segmented" shows all three modes inline. "icon" shows a single cycling button. */
  variant?: "segmented" | "icon";
  className?: string;
};

export function ThemeToggle({ variant = "segmented", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes returns undefined values on the server; wait for hydration.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (variant === "icon") {
    const active = (mounted ? theme : "system") as Mode;
    const next: Mode = active === "light" ? "dark" : active === "dark" ? "system" : "light";
    const Icon =
      !mounted || active === "system" ? Monitor : (resolvedTheme ?? active) === "dark" ? Moon : Sun;
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={`Theme: ${active}. Switch to ${next}.`}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
          className,
        )}
      >
        <Icon size={15} />
      </button>
    );
  }

  const active = (mounted ? theme : "system") as Mode;

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5",
        className,
      )}
    >
      {MODES.map((m) => {
        const Icon = m.icon;
        const isActive = active === m.id;
        return (
          <button
            type="button"
            key={m.id}
            role="radio"
            aria-checked={isActive}
            aria-label={m.label}
            onClick={() => setTheme(m.id)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-sm transition-colors",
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={12} />
          </button>
        );
      })}
    </div>
  );
}
