/**
 * Meta Graph API v21.0 response shapes.
 * Kept narrow — only fields Pulse actually reads.
 * No runtime code, no Zod. Mirror twitter-api-types.ts.
 */

// Short-lived access token response from /oauth/access_token
export type MetaShortLivedTokenResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in?: number;
};

// Long-lived token response (same endpoint, different grant_type)
export type MetaLongLivedTokenResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number; // typically 5,184,000 (60 days)
};

// /me/accounts — list of Pages the user manages
export type MetaPagesListResponse = {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
    tasks: string[]; // e.g. ["ADVERTISE", "ANALYZE", "CREATE_CONTENT", ...]
  }>;
  paging?: { cursors: { before: string; after: string } };
};

// /{page-id}?fields=instagram_business_account — IG linkage check
export type MetaPageWithInstagramResponse = {
  id: string;
  name: string;
  picture?: { data: { url: string } };
  instagram_business_account?: { id: string };
};

// /{ig-user-id}?fields=username,name,profile_picture_url,followers_count
export type MetaInstagramAccountResponse = {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
};

// /{page-id}?fields=name,fan_count,picture
export type MetaFacebookPageDetailResponse = {
  id: string;
  name: string;
  fan_count?: number;
  picture?: { data: { url: string } };
};

// POST /{page-id}/feed — Facebook publish response
export type MetaFacebookFeedPublishResponse = {
  id: string; // format "{page-id}_{post-id}"
};

// POST /{ig-user-id}/media — IG container creation (Phase F1+)
export type MetaInstagramContainerResponse = {
  id: string; // creation_id
};

// POST /{ig-user-id}/media_publish — IG publish response (Phase F1+)
export type MetaInstagramPublishResponse = {
  id: string;
};

// Generic Graph API error shape
export type MetaErrorResponse = {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};
