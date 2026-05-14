import type { Platform } from "@pulse/types/platform";

import type {
  AdapterResult,
  BasePlatformAdapter,
  BuildAuthorizationUrlInput,
  ExchangeAuthCodeInput,
  ExchangeAuthCodeOutput,
} from "./base-platform-adapter";
import { MetaAdapter } from "./meta/meta-adapter";
import { TwitterAdapter } from "./twitter/twitter-adapter";

/**
 * Adapter registry — maps Platform → concrete adapter instance.
 *
 * Adapters are built lazily on first call so env vars are always available by
 * then (validated by Zod schema at NestJS startup; validated manually in workers).
 * Each adapter reads its own credentials from process.env via the config object
 * passed at construction — no NestJS DI needed, so this module can be imported
 * from both apps/api and apps/workers.
 */

class NotImplementedAdapter implements BasePlatformAdapter {
  constructor(public readonly platform: Platform) {}

  private fail(): never {
    throw new Error(`Adapter for ${this.platform} is not implemented yet`);
  }

  buildAuthorizationUrl(_input: BuildAuthorizationUrlInput): AdapterResult<{ url: string }> {
    return this.fail();
  }
  exchangeAuthCode(_input: ExchangeAuthCodeInput): Promise<AdapterResult<ExchangeAuthCodeOutput>> {
    return this.fail();
  }
  publish() {
    return this.fail();
  }
  refreshToken() {
    return this.fail();
  }
  revokeToken() {
    return this.fail();
  }
  fetchProfile() {
    return this.fail();
  }
  fetchAnalytics() {
    return this.fail();
  }
  fetchInbox() {
    return this.fail();
  }
  reply() {
    return this.fail();
  }
}

let adapters: Record<Platform, BasePlatformAdapter> | null = null;

function buildAdapters(): Record<Platform, BasePlatformAdapter> {
  const metaConfig = {
    appId: process.env.META_APP_ID ?? "",
    appSecret: process.env.META_APP_SECRET ?? "",
  };

  return {
    instagram: new MetaAdapter({ platform: "instagram", ...metaConfig }),
    twitter: new TwitterAdapter({
      clientId: process.env.TWITTER_CLIENT_ID ?? "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
    }),
    facebook: new MetaAdapter({ platform: "facebook", ...metaConfig }),
    linkedin: new NotImplementedAdapter("linkedin"),
    threads: new NotImplementedAdapter("threads"),
    tiktok: new NotImplementedAdapter("tiktok"),
    youtube: new NotImplementedAdapter("youtube"),
  };
}

export function getAdapter(platform: Platform): BasePlatformAdapter {
  if (!adapters) adapters = buildAdapters();
  const adapter = adapters[platform];
  if (!adapter) throw new Error(`No adapter registered for platform: ${platform}`);
  return adapter;
}
