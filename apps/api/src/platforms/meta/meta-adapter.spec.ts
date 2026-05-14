import { describe, expect, it } from "vitest";

import { MetaAdapter } from "./meta-adapter";

// ────────────────────────────────────────────────────────────────────────────
// Constructor
// ────────────────────────────────────────────────────────────────────────────

describe("MetaAdapter constructor", () => {
  it("throws when appId is empty", () => {
    expect(() => new MetaAdapter({ platform: "facebook", appId: "", appSecret: "secret" })).toThrow(
      "META_APP_ID is required",
    );
  });

  it("throws when appSecret is empty", () => {
    expect(() => new MetaAdapter({ platform: "facebook", appId: "app-id", appSecret: "" })).toThrow(
      "META_APP_SECRET is required",
    );
  });
});

// ────────────────────────────────────────────────────────────────────────────
// buildAuthorizationUrl
// ────────────────────────────────────────────────────────────────────────────

describe("MetaAdapter.buildAuthorizationUrl", () => {
  const fbAdapter = new MetaAdapter({
    platform: "facebook",
    appId: "test-app-id",
    appSecret: "test-app-secret",
  });

  const igAdapter = new MetaAdapter({
    platform: "instagram",
    appId: "test-app-id",
    appSecret: "test-app-secret",
  });

  it("facebook URL contains pages_manage_posts and does NOT contain instagram_basic", () => {
    const result = fbAdapter.buildAuthorizationUrl({
      state: "test-state",
      redirectUri: "https://example.com/cb",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.url).toContain("pages_manage_posts");
    expect(result.value.url).not.toContain("instagram_basic");
  });

  it("instagram URL contains instagram_basic", () => {
    const result = igAdapter.buildAuthorizationUrl({
      state: "test-state",
      redirectUri: "https://example.com/cb",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.url).toContain("instagram_basic");
  });

  it("URL contains correctly encoded state, redirect_uri, and client_id", () => {
    const result = fbAdapter.buildAuthorizationUrl({
      state: "my-state-value",
      redirectUri: "https://example.com/oauth/callback",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const url = new URL(result.value.url);
    expect(url.searchParams.get("state")).toBe("my-state-value");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/oauth/callback");
    expect(url.searchParams.get("client_id")).toBe("test-app-id");
  });

  it("URL uses v21.0 and www.facebook.com host", () => {
    const result = fbAdapter.buildAuthorizationUrl({
      state: "s",
      redirectUri: "https://example.com/cb",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const url = new URL(result.value.url);
    expect(url.hostname).toBe("www.facebook.com");
    expect(url.pathname).toContain("v21.0");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// publish
// ────────────────────────────────────────────────────────────────────────────

describe("MetaAdapter.publish", () => {
  const credential = {
    accessToken: "page-access-token",
    refreshToken: null,
    expiresAt: null,
    externalAccountId: "page-123",
  };

  it("facebook returns validation_failed when platformPageId is missing", async () => {
    const adapter = new MetaAdapter({
      platform: "facebook",
      appId: "app-id",
      appSecret: "secret",
    });

    const result = await adapter.publish(credential, {
      idempotencyKey: "k1",
      text: "Hello world",
      media: [],
      // platformPageId intentionally omitted
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation_failed");
    expect(result.error.message).toContain("platformPageId");
  });

  it("instagram returns validation_failed when media is empty", async () => {
    const adapter = new MetaAdapter({
      platform: "instagram",
      appId: "app-id",
      appSecret: "secret",
    });

    const result = await adapter.publish(credential, {
      idempotencyKey: "k2",
      text: "Caption only",
      media: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation_failed");
    expect(result.error.message).toContain("Instagram requires at least one");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// refreshToken
// ────────────────────────────────────────────────────────────────────────────

describe("MetaAdapter.refreshToken", () => {
  it("returns platform_error — Meta tokens do not refresh via OAuth", async () => {
    const adapter = new MetaAdapter({
      platform: "facebook",
      appId: "app-id",
      appSecret: "secret",
    });

    const result = await adapter.refreshToken({
      accessToken: "token",
      refreshToken: null,
      expiresAt: null,
      externalAccountId: "page-123",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("platform_error");
    expect(result.error.message).toContain("Reconnection required");
  });
});
