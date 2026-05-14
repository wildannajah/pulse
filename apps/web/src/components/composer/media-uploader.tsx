"use client";

import { Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MediaPreviewGrid } from "@/components/composer/media-preview-grid";
import { trpc } from "@/lib/trpc/trpc";
import { uploadToR2 } from "@/lib/upload/upload-to-r2";
import { cn } from "@/lib/utils/cn";

export type UploadedMedia = {
  storageKey: string;
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
};

export type MediaUploaderProps = {
  value: UploadedMedia[];
  onChange: (next: UploadedMedia[]) => void;
  maxItems?: number;
  disabled?: boolean;
};

type InProgress = {
  id: string;
  filename: string;
  previewUrl: string;
  fraction: number;
  abort: () => void;
};

const ACCEPTED_MIME = "image/jpeg,image/png,image/gif,image/webp";
const ACCEPTED_MIME_SET = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function MediaUploader({
  value,
  onChange,
  maxItems = 4,
  disabled = false,
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [inProgress, setInProgress] = useState<InProgress[]>([]);

  // Ref tracks latest inProgress for unmount cleanup without stale closure
  const inProgressRef = useRef<InProgress[]>([]);
  inProgressRef.current = inProgress;

  const requestUpload = trpc.media.requestUpload.useMutation();
  const confirmUpload = trpc.media.confirmUpload.useMutation();

  useEffect(() => {
    return () => {
      for (const item of inProgressRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      const valid = fileArray.filter((f) => {
        if (!ACCEPTED_MIME_SET.has(f.type)) {
          toast.error(`${f.name}: unsupported file type`);
          return false;
        }
        if (f.size > MAX_FILE_BYTES) {
          toast.error(`${f.name}: exceeds 5 MB limit`);
          return false;
        }
        return true;
      });

      const slots = maxItems - value.length - inProgress.length;
      if (slots <= 0) {
        toast.warning(`Maximum ${maxItems} images allowed`);
        return;
      }

      const toUpload = valid.slice(0, slots);
      if (valid.length > slots) {
        toast.warning(`Only ${slots} more image${slots === 1 ? "" : "s"} can be added`);
      }

      for (const file of toUpload) {
        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);

        setInProgress((prev) => [
          ...prev,
          { id, filename: file.name, previewUrl, fraction: 0, abort: () => {} },
        ]);

        try {
          const { uploadUrl, assetKey } = await requestUpload.mutateAsync({
            kind: "image",
            contentType: file.type,
            filename: file.name,
          });

          const handle = uploadToR2(uploadUrl, file, (p) => {
            setInProgress((prev) =>
              prev.map((item) => (item.id === id ? { ...item, fraction: p.fraction } : item)),
            );
          });

          setInProgress((prev) =>
            prev.map((item) => (item.id === id ? { ...item, abort: handle.abort } : item)),
          );

          await handle.promise;

          const confirmed = await confirmUpload.mutateAsync({
            assetKey,
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
          });

          URL.revokeObjectURL(previewUrl);

          onChange([
            ...value,
            {
              storageKey: assetKey,
              url: confirmed.url,
              filename: file.name,
              mimeType: file.type,
              fileSize: file.size,
            },
          ]);
        } catch (err) {
          URL.revokeObjectURL(previewUrl);
          toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
        } finally {
          setInProgress((prev) => prev.filter((item) => item.id !== id));
        }
      }
    },
    [value, onChange, inProgress, maxItems, requestUpload, confirmUpload],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files) {
      void processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const removeCompleted = (storageKey: string) => {
    onChange(value.filter((m) => m.storageKey !== storageKey));
  };

  const cancelInProgress = (id: string) => {
    const item = inProgress.find((i) => i.id === id);
    item?.abort();
    URL.revokeObjectURL(item?.previewUrl ?? "");
    setInProgress((prev) => prev.filter((i) => i.id !== id));
  };

  const allItems = [
    ...inProgress.map((item) => ({
      id: item.id,
      previewUrl: item.previewUrl,
      filename: item.filename,
      progress: item.fraction,
      onCancel: () => cancelInProgress(item.id),
    })),
    ...value.map((m) => ({
      id: m.storageKey,
      previewUrl: m.url,
      filename: m.filename,
      onRemove: () => removeCompleted(m.storageKey),
    })),
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* biome-ignore lint/a11y/useSemanticElements: drop zone needs div for drag-and-drop API compatibility */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) fileInputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "cursor-pointer select-none rounded-md border-2 border-dashed border-border p-6 text-center text-muted-foreground transition-colors hover:border-foreground/30",
          dragging && "border-foreground/50 bg-muted/40",
          disabled && "pointer-events-none cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME}
          multiple
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <Upload size={20} className="mx-auto mb-2 text-muted-foreground/70" />
        <p className="text-[12px]">
          Drag &amp; drop images here, or{" "}
          <span className="font-medium text-foreground underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          JPEG, PNG, GIF, WEBP — max 5 MB each · up to {maxItems} images
        </p>
      </div>

      <MediaPreviewGrid items={allItems} />
    </div>
  );
}
