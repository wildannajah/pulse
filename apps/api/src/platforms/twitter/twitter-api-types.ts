/**
 * Twitter / X API v2 response shapes.
 * Kept narrow — only fields Pulse actually reads.
 */

export type TwitterTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope: string;
  token_type: string;
};

export type TwitterUserData = {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  url?: string;
};

export type TwitterUserResponse = {
  data: TwitterUserData;
};

export type TwitterTweetResponse = {
  data: {
    id: string;
    text: string;
  };
};

export type TwitterErrorResponse = {
  error?: string;
  error_description?: string;
  errors?: Array<{ message: string; code: number }>;
  detail?: string;
  status?: number;
  title?: string;
  type?: string;
};

/** Response from POST upload.twitter.com/1.1/media/upload.json (simple upload). */
export type TwitterMediaUploadResponse = {
  media_id: number;
  media_id_string: string;
  size: number;
  expires_after_secs: number;
  image?: { image_type: string; w: number; h: number };
  video?: { video_type: string };
};
