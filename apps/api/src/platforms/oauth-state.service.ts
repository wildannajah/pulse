import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { ConfigService } from "@nestjs/config";

import type { Platform } from "@pulse/types/platform";

export type OAuthStatePayload = {
  brandId: string;
  userId: string;
  platform: Platform;
  /** randomBytes(16).toString("hex") — ensures each state is unique */
  nonce: string;
  /** Unix milliseconds; sign() sets to Date.now() + 10 min */
  expiresAt: number;
  /** PKCE code verifier for platforms that use PKCE (Twitter/X). Optional. */
  codeVerifier?: string;
};

const TTL_MS = 10 * 60_000; // 10 minutes

@Injectable()
export class OAuthStateService {
  private readonly secret: Buffer;

  constructor(private readonly config: ConfigService) {
    const hex = this.config.get<string>("OAUTH_STATE_SECRET");
    if (!hex) {
      throw new Error("OAUTH_STATE_SECRET is required");
    }
    if (!/^[0-9a-f]{64}$/i.test(hex)) {
      throw new Error("OAUTH_STATE_SECRET must be exactly 64 hex characters (32 bytes)");
    }
    this.secret = Buffer.from(hex, "hex");
  }

  sign(
    payload: Omit<OAuthStatePayload, "nonce" | "expiresAt"> & Partial<OAuthStatePayload>,
  ): string {
    const full: OAuthStatePayload = {
      ...payload,
      nonce: payload.nonce ?? randomBytes(16).toString("hex"),
      expiresAt: payload.expiresAt ?? Date.now() + TTL_MS,
    };
    const payloadJson = JSON.stringify(full);
    const payloadB64 = Buffer.from(payloadJson).toString("base64url");
    const sig = this.computeHmac(payloadB64);
    return `${payloadB64}.${sig}`;
  }

  verify(token: string): OAuthStatePayload {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) {
      throw new Error("Invalid state token: missing signature");
    }

    const payloadB64 = token.slice(0, dotIdx);
    const receivedSig = token.slice(dotIdx + 1);
    const expectedSig = this.computeHmac(payloadB64);

    // Constant-time compare to prevent timing attacks
    const receivedBuf = Buffer.from(receivedSig, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");

    if (receivedBuf.length !== expectedBuf.length || !timingSafeEqual(receivedBuf, expectedBuf)) {
      throw new Error("Invalid state token: signature mismatch");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    } catch {
      throw new Error("Invalid state token: malformed payload");
    }

    assertValidPayload(payload);

    if (payload.expiresAt < Date.now()) {
      throw new Error("State token has expired");
    }

    return payload;
  }

  private computeHmac(data: string): string {
    return createHmac("sha256", this.secret).update(data).digest("base64url");
  }
}

function assertValidPayload(value: unknown): asserts value is OAuthStatePayload {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid state token: payload is not an object");
  }
  const p = value as Record<string, unknown>;
  const requiredFields: (keyof OAuthStatePayload)[] = [
    "brandId",
    "userId",
    "platform",
    "nonce",
    "expiresAt",
  ];
  for (const field of requiredFields) {
    if (p[field] === undefined || p[field] === null) {
      throw new Error(`Invalid state token: missing field "${field}"`);
    }
  }
  if (typeof p.expiresAt !== "number") {
    throw new Error('Invalid state token: "expiresAt" must be a number');
  }
}
