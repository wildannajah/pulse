"use client";

import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { MediaUploader, type UploadedMedia } from "@/components/composer/media-uploader";
import { TextEditor } from "@/components/composer/text-editor";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/trpc";
import { useBrandStore } from "@/stores/brand-store";

const TWITTER_LIMIT = 280;

export function ComposerClient() {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);

  const accountsQuery = trpc.connectedAccount.list.useQuery(undefined, {
    enabled: !!activeBrandId,
  });
  const postCreate = trpc.post.create.useMutation();
  const postPublishNow = trpc.post.publishNow.useMutation();

  const accounts = accountsQuery.data ?? [];
  const hasActiveTwitter = accounts.some((a) => a.platform === "twitter" && a.status === "ACTIVE");

  const isMutating = postCreate.isPending || postPublishNow.isPending;
  const isOverLimit = text.length > TWITTER_LIMIT;
  const isEmpty = text.trim().length === 0;

  const publishNowDisabled = isEmpty || isOverLimit || !hasActiveTwitter || isMutating;
  const saveDraftDisabled = isEmpty || isMutating;

  const handlePublishNow = async () => {
    try {
      const created = (await postCreate.mutateAsync({
        text,
        platforms: ["twitter"],
        mediaKeys: media.map((m) => m.storageKey),
      })) as { id: string; status: string };
      await postPublishNow.mutateAsync({ id: created.id });
      toast.success("Tweet queued — publishing now");
      setText("");
      setMedia([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
  };

  const handleSaveDraft = async () => {
    try {
      await postCreate.mutateAsync({
        text,
        platforms: ["twitter"],
        mediaKeys: media.map((m) => m.storageKey),
      });
      toast.success("Draft saved");
      setText("");
      setMedia([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 md:flex-row md:gap-8">
      {/* Left / top — editor */}
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compose
          </div>
          <TextEditor
            value={text}
            onChange={setText}
            maxLength={TWITTER_LIMIT}
            disabled={isMutating}
          />
        </div>

        {/* Platform chip */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-foreground">
            <PlatformIcon platform="twitter" size={14} />
            Twitter/X
          </div>
        </div>

        {/* Media uploader */}
        <MediaUploader value={media} onChange={setMedia} maxItems={4} disabled={isMutating} />

        {/* Warning: no connected twitter */}
        {!accountsQuery.isLoading && !hasActiveTwitter ? (
          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-[12px] text-yellow-800">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              No active Twitter account.{" "}
              <Link
                href="/app/settings/connections"
                className="font-semibold underline underline-offset-2"
              >
                Connect one
              </Link>{" "}
              to publish.
            </span>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSaveDraft} disabled={saveDraftDisabled}>
            Save Draft
          </Button>
          <Button onClick={handlePublishNow} disabled={publishNowDisabled}>
            Publish Now
          </Button>
        </div>
      </div>

      {/* Right / bottom — preview */}
      <div className="w-full md:w-[300px] md:flex-shrink-0">
        <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          Preview
        </div>
        <div className="relative rounded-lg border border-border bg-card p-4">
          <div className="absolute top-3 right-3">
            <PlatformIcon platform="twitter" size={16} />
          </div>
          <p className="min-h-[80px] text-[13px] leading-relaxed text-foreground">
            {text || <span className="text-muted-foreground">Your tweet will appear here…</span>}
          </p>
          {media.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {media.map((m) => (
                // biome-ignore lint/performance/noImgElement: R2 CDN domain not configured in next/image
                <img
                  key={m.storageKey}
                  src={m.url}
                  alt={m.filename}
                  className="h-24 w-full rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
