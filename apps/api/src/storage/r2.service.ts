import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

import type { Env } from "../config/env-schema";

@Injectable()
export class R2Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnBase: string;

  constructor(config: ConfigService<Env, true>) {
    const accountId = config.get("R2_ACCOUNT_ID", { infer: true });
    this.bucket = config.get("R2_BUCKET_NAME", { infer: true });
    this.cdnBase = config.get("R2_PUBLIC_URL", { infer: true }).replace(/\/$/, "");

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      // R2 does not support virtual-hosted style (bucket-as-subdomain)
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get("R2_ACCESS_KEY_ID", { infer: true }),
        secretAccessKey: config.get("R2_SECRET_ACCESS_KEY", { infer: true }),
      },
    });
  }

  /** Presigned URL for a direct browser → R2 PUT. Expires in 5 minutes. */
  async presignPut(key: string, contentType: string, expiresIn = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn },
    );
  }

  /** Presigned URL for a private read. Expires in 1 hour by default. */
  async presignGet(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn,
    });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /** Public CDN URL — only valid when the bucket has public access enabled. */
  publicUrl(key: string): string {
    return `${this.cdnBase}/${key}`;
  }

  get bucketName(): string {
    return this.bucket;
  }
}
