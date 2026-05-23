"use client";

import { format } from "date-fns";
import { CalendarClock, X } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type SchedulePickerProps = {
  value: Date | null;
  onChange: (next: Date | null) => void;
  disabled?: boolean;
};

const MIN_LEAD_MINUTES = 5;

function toLocalInputValue(date: Date): string {
  // datetime-local expects "YYYY-MM-DDTHH:mm" in the user's wall-clock time.
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function minSelectable(): string {
  const d = new Date(Date.now() + MIN_LEAD_MINUTES * 60_000);
  return toLocalInputValue(d);
}

export function SchedulePicker({ value, onChange, disabled = false }: SchedulePickerProps) {
  const inputId = useId();
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const inputValue = value ? toLocalInputValue(value) : "";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        <CalendarClock size={13} />
        Schedule
      </label>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="datetime-local"
          value={inputValue}
          min={minSelectable()}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw) {
              onChange(null);
              return;
            }
            const parsed = new Date(raw);
            if (Number.isNaN(parsed.getTime())) {
              onChange(null);
              return;
            }
            onChange(parsed);
          }}
          className={cn(
            "h-9 flex-1 rounded-md border border-border bg-background px-3 text-[13px] outline-none focus:ring-2 focus:ring-ring/40",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
        {value ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Clear scheduled time"
          >
            <X size={13} />
          </Button>
        ) : null}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {value ? (
          <>
            Will publish{" "}
            <span className="font-medium text-foreground">{format(value, "PPPP 'at' p")}</span> (
            {tzName})
          </>
        ) : (
          <>Times shown in your local timezone ({tzName}). Stored as UTC.</>
        )}
      </p>
    </div>
  );
}
