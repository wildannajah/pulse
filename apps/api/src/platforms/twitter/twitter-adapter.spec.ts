import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdapterCredential, PublishMediaInput } from "../base-platform-adapter";
import { TwitterAdapter } from "./twitter-adapter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const adapter = new TwitterAdapter({
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
});

const credential: AdapterCredential = {
  accessToken: "test-access-token",
  refreshToken: null,
  expiresAt: null,
  externalAccountId: "user-123",
};

function makeImageMedia(overrides: Partial<PublishMediaInput> = {}): PublishMediaInput {
  return {
    key: "workspace/brand/image/abc.jpg",
    kind: "image",
    filename: "photo.jpg",
    url: "https://cdn.example.com/abc.jpg",
    mimeType: "image/jpeg",
    ...overrides,
  };
}

/** Creates a tiny 1-byte Blob response for R2 CDN download mocks */
function mockR2Response(): Response {
  return new Response(new Uint8Array(1), { status: 200 });
}

function mockTwitterMediaResponse(mediaIdString = "1234567890"): Response {
  return new Response(
    JSON.stringify({
      media_id: 1234567890,
      media_id_string: mediaIdString,
      size: 1,
      expires_after_secs: 86400,
      image: { image_type: "image/jpeg", w: 100, h: 100 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function mockTweetsResponse(id = "tw-1"): Response {
  return new Response(JSON.stringify({ data: { id, text: "hello" } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("TwitterAdapter.publish", () => {
  // Declared at describe scope so TypeScript infers the precise type from vi.spyOn
  const fetchSpy = vi.spyOn(global, "fetch");

  afterEach(() => {
    vi.clearAllMocks();
  });

  // A5.5 — Text-only (regression)
  it("publishes a text-only tweet without touching media endpoints", async () => {
    fetchSpy.mockResolvedValueOnce(mockTweetsResponse("tw-text"));

    const result = await adapter.publish(credential, {
      idempotencyKey: "k1",
      text: "Hello world",
      media: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.externalPostId).toBe("tw-text");
    expect(result.value.externalUrl).toContain("tw-text");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("tweets");
    const body = JSON.parse(init.body as string);
    expect(body.media).toBeUndefined();
  });

  // A5.1 — Image upload happy path
  it("uploads an image and attaches its media_id to the tweet", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockR2Response()) // R2 CDN download
      .mockResolvedValueOnce(mockTwitterMediaResponse("111")) // media/upload.json
      .mockResolvedValueOnce(mockTweetsResponse("tw-img")); // tweets POST

    const result = await adapter.publish(credential, {
      idempotencyKey: "k2",
      text: "Check this out",
      media: [makeImageMedia()],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.externalPostId).toBe("tw-img");

    expect(fetchSpy).toHaveBeenCalledTimes(3);

    // First call: R2 CDN download
    expect((fetchSpy.mock.calls[0] as [string])[0]).toBe("https://cdn.example.com/abc.jpg");

    // Second call: Twitter media upload
    expect((fetchSpy.mock.calls[1] as [string])[0]).toContain("media/upload.json");

    // Third call: tweet POST with media_ids
    const [tweetsUrl, tweetsInit] = fetchSpy.mock.calls[2] as [string, RequestInit];
    expect(tweetsUrl).toContain("tweets");
    const tweetsBody = JSON.parse(tweetsInit.body as string);
    expect(tweetsBody.media?.media_ids).toEqual(["111"]);
  });

  // A5.2 — Rejects > 4 media items, no fetch calls
  it("rejects more than 4 media items without making any fetch call", async () => {
    const result = await adapter.publish(credential, {
      idempotencyKey: "k3",
      text: "Too many images",
      media: Array(5).fill(makeImageMedia()),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation_failed");
    expect(result.error.message).toMatch(/4/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // A5.3 — Rejects video kind with validation_failed
  it("rejects video media with validation_failed mentioning chunked", async () => {
    const result = await adapter.publish(credential, {
      idempotencyKey: "k4",
      text: "Watch this",
      media: [makeImageMedia({ kind: "video", mimeType: "video/mp4" })],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation_failed");
    expect(result.error.message).toMatch(/chunked/i);
  });

  // A5.4 — Bubbles auth_expired from media upload; tweets endpoint never called
  it("bubbles auth_expired when media upload returns 401 and never calls tweets", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockR2Response()) // R2 download ok
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ); // Twitter upload 401

    const result = await adapter.publish(credential, {
      idempotencyKey: "k5",
      text: "Oops",
      media: [makeImageMedia()],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("auth_expired");

    // Only 2 fetches: R2 download + media upload. Tweets endpoint never reached.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const tweetsCall = fetchSpy.mock.calls.find(
      ([url]) => typeof url === "string" && url.includes("tweets"),
    );
    expect(tweetsCall).toBeUndefined();
  });
});
