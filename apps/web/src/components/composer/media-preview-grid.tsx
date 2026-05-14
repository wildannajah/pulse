"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MediaPreviewItem = {
  id: string;
  previewUrl: string;
  filename: string;
  /** 0..1 if still uploading; undefined when done */
  progress?: number;
  onRemove?: () => void;
  onCancel?: () => void;
};

type MediaPreviewGridProps = {
  items: MediaPreviewItem[];
};

export function MediaPreviewGrid({ items }: MediaPreviewGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div key={item.id} className="group relative h-20 w-20 overflow-hidden rounded-md">
          {item.previewUrl ? (
            // biome-ignore lint/performance/noImgElement: previewUrl may be a blob: URL, incompatible with next/image
            <img src={item.previewUrl} alt={item.filename} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted px-1">
              <span className="truncate text-[10px] text-muted-foreground">{item.filename}</span>
            </div>
          )}

          {/* Progress bar */}
          {item.progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${Math.round(item.progress * 100)}%` }}
              />
            </div>
          )}

          {/* Remove / cancel button */}
          {(item.onRemove ?? item.onCancel) && (
            <button
              type="button"
              onClick={item.progress !== undefined ? item.onCancel : item.onRemove}
              className={cn(
                "absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100",
              )}
              aria-label={item.progress !== undefined ? "Cancel upload" : "Remove"}
            >
              <X size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
