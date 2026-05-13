import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { brandProcedure, router } from "../trpc";

const ALLOWED_MIME: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  document: ["application/pdf"],
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
};

const MIME_TO_MEDIA_TYPE = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "image/gif": "GIF",
  "video/mp4": "VIDEO",
  "video/quicktime": "VIDEO",
  "video/webm": "VIDEO",
  "application/pdf": "DOCUMENT",
} as const;

export const mediaRouter = router({
  /**
   * Step 1 — client requests a presigned PUT URL.
   * Returns the URL + the asset key the client must use in confirmUpload.
   * Path: {workspaceId}/{brandId}/{kind}/{uuid}.{ext} — enforces tenant isolation.
   */
  requestUpload: brandProcedure
    .input(
      z.object({
        kind: z.enum(["image", "video", "document"]),
        contentType: z.string(),
        filename: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const allowed = ALLOWED_MIME[input.kind];
      if (!allowed?.includes(input.contentType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `contentType "${input.contentType}" is not allowed for kind "${input.kind}"`,
        });
      }

      const ext = MIME_TO_EXT[input.contentType] ?? "";
      const id = crypto.randomUUID();
      const key = `${ctx.brand.workspaceId}/${ctx.brand.id}/${input.kind}/${id}${ext}`;

      const uploadUrl = await ctx.r2.presignPut(key, input.contentType);

      return { uploadUrl, assetKey: key };
    }),

  /**
   * Step 2 — client confirms the upload succeeded, writing the PostMedia row.
   * postId is optional: media can be attached to a post later.
   */
  confirmUpload: brandProcedure
    .input(
      z.object({
        assetKey: z.string().min(1),
        postId: z.string().optional(),
        filename: z.string().max(255),
        fileSize: z.number().int().positive(),
        mimeType: z.string(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        durationMs: z.number().int().positive().optional(),
        altText: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the key belongs to this brand — prevents cross-brand data access
      const expectedPrefix = `${ctx.brand.workspaceId}/${ctx.brand.id}/`;
      if (!input.assetKey.startsWith(expectedPrefix)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Asset key does not belong to this brand",
        });
      }

      const mediaType = MIME_TO_MEDIA_TYPE[input.mimeType as keyof typeof MIME_TO_MEDIA_TYPE];
      if (!mediaType) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported mimeType: ${input.mimeType}`,
        });
      }

      const media = await ctx.prisma.postMedia.create({
        data: {
          brandId: ctx.brand.id,
          postId: input.postId ?? null,
          type: mediaType,
          url: ctx.r2.publicUrl(input.assetKey),
          fileName: input.filename,
          fileSize: BigInt(input.fileSize),
          mimeType: input.mimeType,
          width: input.width ?? null,
          height: input.height ?? null,
          durationMs: input.durationMs ?? null,
          altText: input.altText ?? null,
          storageBucket: ctx.r2.bucketName,
          storageKey: input.assetKey,
          uploadedById: ctx.user.id,
        },
      });

      return { id: media.id, url: media.url };
    }),
});
