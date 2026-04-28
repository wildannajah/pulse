-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'TWITTER', 'FACEBOOK', 'LINKEDIN', 'THREADS', 'TIKTOK', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('PERSONAL', 'TEAM', 'AGENCY');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'RECONNECTING', 'ERROR');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'PARTIALLY_FAILED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PostMediaType" AS ENUM ('IMAGE', 'VIDEO', 'GIF', 'CAROUSEL', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "InboxItemType" AS ENUM ('DIRECT_MESSAGE', 'COMMENT', 'MENTION', 'REPLY', 'REACTION');

-- CreateEnum
CREATE TYPE "InboxStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SentimentTag" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POST_PUBLISHED', 'POST_FAILED', 'TOKEN_EXPIRED', 'APPROVAL_REQUESTED', 'APPROVAL_GRANTED', 'APPROVAL_REJECTED', 'MENTION_RECEIVED', 'COMMENT_RECEIVED', 'TEAM_INVITED', 'ANALYTICS_DIGEST');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('POST_PUBLISH', 'TOKEN_REFRESH', 'ANALYTICS_SYNC', 'INBOX_SYNC', 'REPORT_GENERATION', 'MEDIA_PROCESSING');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'AGENCY', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "passwordHash" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "totpSecret" TEXT,
    "totpEnabledAt" TIMESTAMP(3),
    "backupCodes" TEXT[],
    "lastLoginAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "WorkspaceType" NOT NULL DEFAULT 'PERSONAL',
    "ownerId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialEndsAt" TIMESTAMP(3),
    "maxBrands" INTEGER NOT NULL DEFAULT 1,
    "maxMembers" INTEGER NOT NULL DEFAULT 1,
    "maxScheduledPosts" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
    "brandAccess" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_invitations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "brandColor" TEXT,
    "websiteUrl" TEXT,
    "industry" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "brandVoice" TEXT,
    "defaultHashtags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connected_accounts" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformUsername" TEXT NOT NULL,
    "platformPageId" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER,
    "followingCount" INTEGER,
    "postCount" INTEGER,
    "connectedById" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "templateId" TEXT,
    "duplicatedFromId" TEXT,
    "bulkUploadId" TEXT,
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "firstComment" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPromptUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_variants" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "isThread" BOOLEAN NOT NULL DEFAULT false,
    "threadParts" JSONB,
    "altText" TEXT,
    "mediaIds" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_publications" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "connectedAccountId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'SCHEDULED',
    "platformPostId" TEXT,
    "platformPostUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_media" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "brandId" TEXT NOT NULL,
    "type" "PostMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "altText" TEXT,
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_templates" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "platforms" "Platform"[],
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "post_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_approvals" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "post_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtag_sets" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashtags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hashtag_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_labels" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_content_labels" (
    "postId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "post_content_labels_pkey" PRIMARY KEY ("postId","labelId")
);

-- CreateTable
CREATE TABLE "bulk_uploads" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorReport" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_items" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "connectedAccountId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "type" "InboxItemType" NOT NULL,
    "status" "InboxStatus" NOT NULL DEFAULT 'UNREAD',
    "platformSenderId" TEXT NOT NULL,
    "senderUsername" TEXT NOT NULL,
    "senderDisplayName" TEXT,
    "senderAvatarUrl" TEXT,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "parentPostId" TEXT,
    "platformParentId" TEXT,
    "platformItemId" TEXT NOT NULL,
    "threadId" TEXT,
    "sentimentTag" "SentimentTag" NOT NULL DEFAULT 'UNKNOWN',
    "sentimentScore" DOUBLE PRECISION,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_replies" (
    "id" TEXT NOT NULL,
    "inboxItemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "sentAt" TIMESTAMP(3),
    "platformReplyId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_replies" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "connectedAccountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "totalPosts" INTEGER NOT NULL,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "reach" BIGINT NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawMetrics" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_metrics" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "reach" BIGINT NOT NULL DEFAULT 0,
    "videoViews" BIGINT NOT NULL DEFAULT 0,
    "videoCompletionRate" DOUBLE PRECISION,
    "clickThroughs" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" JSONB,

    CONSTRAINT "post_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audience_insights" (
    "id" TEXT NOT NULL,
    "connectedAccountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ageRanges" JSONB,
    "genderSplit" JSONB,
    "topCountries" JSONB,
    "topCities" JSONB,
    "topLanguages" JSONB,
    "mostActiveHours" JSONB,
    "mostActiveDays" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "followerCount" INTEGER,
    "postCount" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_snapshots" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "followers" INTEGER NOT NULL,
    "posts" INTEGER NOT NULL,
    "avgEngagement" DOUBLE PRECISION NOT NULL,
    "topPostsData" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "platforms" "Platform"[],
    "metrics" TEXT[],
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3),
    "recurrence" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "estimatedCostCents" INTEGER NOT NULL,
    "wasUsed" BOOLEAN,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "relatedPostId" TEXT,
    "relatedInboxItemId" TEXT,
    "relatedBrandId" TEXT,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "digestFrequency" TEXT NOT NULL DEFAULT 'daily',
    "digestTime" TEXT NOT NULL DEFAULT '09:00',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_logs" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "workspaceId" TEXT,
    "brandId" TEXT,
    "postId" TEXT,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "bullJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "invoiceUrl" TEXT,
    "pdfUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "lastUsedIp" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerAccountId_key" ON "oauth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_ownerId_idx" ON "workspaces"("ownerId");

-- CreateIndex
CREATE INDEX "workspaces_slug_idx" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_idx" ON "workspace_members"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_token_key" ON "workspace_invitations"("token");

-- CreateIndex
CREATE INDEX "workspace_invitations_token_idx" ON "workspace_invitations"("token");

-- CreateIndex
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_workspaceId_email_key" ON "workspace_invitations"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "brands_workspaceId_idx" ON "brands"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_workspaceId_slug_key" ON "brands"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "connected_accounts_brandId_idx" ON "connected_accounts"("brandId");

-- CreateIndex
CREATE INDEX "connected_accounts_platform_idx" ON "connected_accounts"("platform");

-- CreateIndex
CREATE INDEX "connected_accounts_status_idx" ON "connected_accounts"("status");

-- CreateIndex
CREATE INDEX "connected_accounts_tokenExpiresAt_idx" ON "connected_accounts"("tokenExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "connected_accounts_brandId_platform_platformUserId_key" ON "connected_accounts"("brandId", "platform", "platformUserId");

-- CreateIndex
CREATE INDEX "posts_brandId_status_idx" ON "posts"("brandId", "status");

-- CreateIndex
CREATE INDEX "posts_brandId_scheduledAt_idx" ON "posts"("brandId", "scheduledAt");

-- CreateIndex
CREATE INDEX "posts_brandId_publishedAt_idx" ON "posts"("brandId", "publishedAt");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_deletedAt_idx" ON "posts"("deletedAt");

-- CreateIndex
CREATE INDEX "post_variants_postId_idx" ON "post_variants"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "post_variants_postId_platform_key" ON "post_variants"("postId", "platform");

-- CreateIndex
CREATE INDEX "post_publications_postId_idx" ON "post_publications"("postId");

-- CreateIndex
CREATE INDEX "post_publications_platform_status_idx" ON "post_publications"("platform", "status");

-- CreateIndex
CREATE INDEX "post_publications_publishedAt_idx" ON "post_publications"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "post_publications_postId_connectedAccountId_key" ON "post_publications"("postId", "connectedAccountId");

-- CreateIndex
CREATE INDEX "post_media_postId_idx" ON "post_media"("postId");

-- CreateIndex
CREATE INDEX "post_media_brandId_idx" ON "post_media"("brandId");

-- CreateIndex
CREATE INDEX "post_templates_brandId_idx" ON "post_templates"("brandId");

-- CreateIndex
CREATE INDEX "post_approvals_postId_idx" ON "post_approvals"("postId");

-- CreateIndex
CREATE INDEX "post_approvals_reviewerId_status_idx" ON "post_approvals"("reviewerId", "status");

-- CreateIndex
CREATE INDEX "post_comments_postId_idx" ON "post_comments"("postId");

-- CreateIndex
CREATE INDEX "hashtag_sets_brandId_idx" ON "hashtag_sets"("brandId");

-- CreateIndex
CREATE INDEX "content_labels_brandId_idx" ON "content_labels"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "content_labels_brandId_name_key" ON "content_labels"("brandId", "name");

-- CreateIndex
CREATE INDEX "bulk_uploads_brandId_idx" ON "bulk_uploads"("brandId");

-- CreateIndex
CREATE INDEX "inbox_items_brandId_status_idx" ON "inbox_items"("brandId", "status");

-- CreateIndex
CREATE INDEX "inbox_items_brandId_type_idx" ON "inbox_items"("brandId", "type");

-- CreateIndex
CREATE INDEX "inbox_items_assignedToId_status_idx" ON "inbox_items"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "inbox_items_receivedAt_idx" ON "inbox_items"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_items_connectedAccountId_platformItemId_key" ON "inbox_items"("connectedAccountId", "platformItemId");

-- CreateIndex
CREATE INDEX "inbox_replies_inboxItemId_idx" ON "inbox_replies"("inboxItemId");

-- CreateIndex
CREATE INDEX "saved_replies_brandId_idx" ON "saved_replies"("brandId");

-- CreateIndex
CREATE INDEX "analytics_snapshots_connectedAccountId_date_idx" ON "analytics_snapshots"("connectedAccountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_connectedAccountId_date_key" ON "analytics_snapshots"("connectedAccountId", "date");

-- CreateIndex
CREATE INDEX "post_metrics_publicationId_snapshotAt_idx" ON "post_metrics"("publicationId", "snapshotAt");

-- CreateIndex
CREATE INDEX "audience_insights_connectedAccountId_idx" ON "audience_insights"("connectedAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "audience_insights_connectedAccountId_date_key" ON "audience_insights"("connectedAccountId", "date");

-- CreateIndex
CREATE INDEX "competitors_brandId_idx" ON "competitors"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_brandId_platform_platformUserId_key" ON "competitors"("brandId", "platform", "platformUserId");

-- CreateIndex
CREATE INDEX "competitor_snapshots_competitorId_idx" ON "competitor_snapshots"("competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_snapshots_competitorId_date_key" ON "competitor_snapshots"("competitorId", "date");

-- CreateIndex
CREATE INDEX "analytics_reports_brandId_idx" ON "analytics_reports"("brandId");

-- CreateIndex
CREATE INDEX "ai_generations_workspaceId_createdAt_idx" ON "ai_generations"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_generations_userId_idx" ON "ai_generations"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- CreateIndex
CREATE INDEX "job_logs_type_status_idx" ON "job_logs"("type", "status");

-- CreateIndex
CREATE INDEX "job_logs_workspaceId_idx" ON "job_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "job_logs_scheduledFor_idx" ON "job_logs"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_workspaceId_key" ON "subscriptions"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripeInvoiceId_key" ON "invoices"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "usage_records_workspaceId_metric_periodStart_idx" ON "usage_records"("workspaceId", "metric", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_workspaceId_idx" ON "api_keys"("workspaceId");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_createdAt_idx" ON "audit_logs"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "post_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_duplicatedFromId_fkey" FOREIGN KEY ("duplicatedFromId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_bulkUploadId_fkey" FOREIGN KEY ("bulkUploadId") REFERENCES "bulk_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_variants" ADD CONSTRAINT "post_variants_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_publications" ADD CONSTRAINT "post_publications_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_publications" ADD CONSTRAINT "post_publications_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "connected_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_templates" ADD CONSTRAINT "post_templates_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_approvals" ADD CONSTRAINT "post_approvals_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_approvals" ADD CONSTRAINT "post_approvals_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtag_sets" ADD CONSTRAINT "hashtag_sets_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_labels" ADD CONSTRAINT "content_labels_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_content_labels" ADD CONSTRAINT "post_content_labels_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_content_labels" ADD CONSTRAINT "post_content_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "content_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "connected_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_replies" ADD CONSTRAINT "inbox_replies_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "inbox_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_replies" ADD CONSTRAINT "inbox_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_replies" ADD CONSTRAINT "saved_replies_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_metrics" ADD CONSTRAINT "post_metrics_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "post_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience_insights" ADD CONSTRAINT "audience_insights_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_snapshots" ADD CONSTRAINT "competitor_snapshots_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
