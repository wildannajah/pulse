"use client";

import { cn } from "@/lib/utils/cn";

type TextEditorProps = {
  value: string;
  onChange: (val: string) => void;
  maxLength: number;
  disabled?: boolean;
};

export function TextEditor({ value, onChange, maxLength, disabled = false }: TextEditorProps) {
  const count = value.length;
  const isOver = count > maxLength;

  return (
    <div className="relative flex flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Write your post…"
        className={cn(
          "min-h-[140px] w-full resize-y rounded-md border border-border bg-background px-3 py-2.5 text-[13px] leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-ring/40",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
      <div className="mt-1 flex justify-end">
        <span
          className={cn(
            "font-mono text-[11px]",
            isOver ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {count} / {maxLength}
        </span>
      </div>
    </div>
  );
}
