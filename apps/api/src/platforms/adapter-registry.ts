import type { Platform } from "@pulse/types/platform";

import type {
  AdapterResult,
  BasePlatformAdapter,
  BuildAuthorizationUrlInput,
  ExchangeAuthCodeInput,
  ExchangeAuthCodeOutput,
} from "./base-platform-adapter";

/**
 * Adapter registry — maps Platform → concrete adapter instance.
 *
 * Phase 0: every platform throws "not implemented" so the type contract is
 * exercised by callers (workers, procedures) without committing to any
 * platform's API client. Concrete adapters land per platform in 1B.
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

const ADAPTERS: Record<Platform, BasePlatformAdapter> = {
  instagram: new NotImplementedAdapter("instagram"),
  twitter: new NotImplementedAdapter("twitter"),
  facebook: new NotImplementedAdapter("facebook"),
  linkedin: new NotImplementedAdapter("linkedin"),
  threads: new NotImplementedAdapter("threads"),
  tiktok: new NotImplementedAdapter("tiktok"),
  youtube: new NotImplementedAdapter("youtube"),
};

export function getAdapter(platform: Platform): BasePlatformAdapter {
  const adapter = ADAPTERS[platform];
  if (!adapter) throw new Error(`No adapter registered for platform: ${platform}`);
  return adapter;
}
