/**
 * Mock data for the design-system scaffold pass.
 *
 * Replace each export with real tRPC queries when wiring data.
 * Shape mirrors the Prisma schema where it exists, so the swap is
 * straightforward later.
 */

import type { Platform } from "@pulse/types/platform";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type MockBrand = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type MockPlatformStat = {
  platform: Platform;
  followers: string;
};

export type MockPost = {
  id: string;
  content: string;
  platforms: Platform[];
  status: PostStatus;
  date: string | null;
  time: string | null;
  likes: number;
  comments: number;
  reach: number;
};

export type MockMessage = {
  id: string;
  platform: Platform;
  sender: string;
  initials: string;
  content: string;
  time: string;
  read: boolean;
};

export type MockActivityType = "like" | "comment" | "share" | "mention";

export type MockActivityItem = {
  id: string;
  type: MockActivityType;
  platform: Platform;
  actor: string;
  initials: string;
  content: string;
  post: string | null;
  time: string;
  /** sortable timestamp pseudo-int (YYYYMMDDHHmm) */
  ts: number;
};

export const MOCK_BRANDS: MockBrand[] = [
  { id: "b1", name: "Acme Corp", initials: "AC", color: "#1a1a1a" },
  { id: "b2", name: "Acme Labs", initials: "AL", color: "#0A66C2" },
  { id: "b3", name: "Acme Blog", initials: "AB", color: "#E1306C" },
];

export const MOCK_PLATFORM_FOLLOWERS: Record<Platform, string> = {
  instagram: "24.6k",
  twitter: "18.2k",
  facebook: "31.4k",
  linkedin: "8.9k",
  threads: "5.1k",
  tiktok: "42.8k",
  youtube: "12.3k",
};

export const MOCK_POSTS: MockPost[] = [
  {
    id: "p1",
    content: "Excited to announce our new product launch! Stay tuned for the big reveal next week.",
    platforms: ["instagram", "twitter"],
    status: "scheduled",
    date: "Apr 29",
    time: "10:00",
    likes: 0,
    comments: 0,
    reach: 0,
  },
  {
    id: "p2",
    content: "Our latest case study is live — learn how we helped a client grow 3× in 6 months.",
    platforms: ["linkedin", "facebook"],
    status: "published",
    date: "Apr 27",
    time: "09:00",
    likes: 142,
    comments: 18,
    reach: 3200,
  },
  {
    id: "p3",
    content: "Behind the scenes at our team offsite. What an incredible week with the whole team.",
    platforms: ["instagram"],
    status: "published",
    date: "Apr 26",
    time: "14:00",
    likes: 892,
    comments: 43,
    reach: 12400,
  },
  {
    id: "p4",
    content: "We're hiring! Join our growing team of designers and engineers. Link in bio.",
    platforms: ["twitter", "linkedin"],
    status: "scheduled",
    date: "Apr 30",
    time: "11:00",
    likes: 0,
    comments: 0,
    reach: 0,
  },
  {
    id: "p5",
    content: "Q1 results breakdown — our best quarter yet. Full breakdown in the thread below.",
    platforms: ["twitter"],
    status: "draft",
    date: null,
    time: null,
    likes: 0,
    comments: 0,
    reach: 0,
  },
  {
    id: "p6",
    content: "Meet our new Head of Design — we're so excited to have her join the team!",
    platforms: ["instagram", "linkedin"],
    status: "published",
    date: "Apr 24",
    time: "11:00",
    likes: 534,
    comments: 61,
    reach: 8700,
  },
  {
    id: "p7",
    content: "Just dropped: our Spring collection is now live. Shop the link in bio 🛍️",
    platforms: ["instagram", "facebook"],
    status: "published",
    date: "Apr 22",
    time: "10:00",
    likes: 1204,
    comments: 87,
    reach: 24300,
  },
  {
    id: "p8",
    content: "We'll be at Config 2026 next month — come say hi at booth #42.",
    platforms: ["twitter", "linkedin"],
    status: "scheduled",
    date: "May 10",
    time: "09:00",
    likes: 0,
    comments: 0,
    reach: 0,
  },
  {
    id: "p9",
    content: "How we scaled our content operation from 2 posts/week to 20 without burning out.",
    platforms: ["linkedin"],
    status: "published",
    date: "Apr 20",
    time: "08:00",
    likes: 289,
    comments: 34,
    reach: 5600,
  },
  {
    id: "p10",
    content: "Friday feeling ☀️ — here's what we've been working on behind the scenes this week.",
    platforms: ["instagram"],
    status: "published",
    date: "Apr 18",
    time: "15:00",
    likes: 671,
    comments: 29,
    reach: 9800,
  },
  {
    id: "p11",
    content: "Product update: we've completely redesigned the dashboard based on your feedback.",
    platforms: ["twitter", "instagram"],
    status: "draft",
    date: null,
    time: null,
    likes: 0,
    comments: 0,
    reach: 0,
  },
  {
    id: "p12",
    content: "Thanks to everyone who joined our live AMA yesterday — the recording is now up.",
    platforms: ["youtube", "facebook"],
    status: "published",
    date: "Apr 15",
    time: "18:00",
    likes: 198,
    comments: 52,
    reach: 6100,
  },
];

export const MOCK_MESSAGES: MockMessage[] = [
  {
    id: "m1",
    platform: "instagram",
    sender: "sarah.jones",
    initials: "SJ",
    content: "Love your products! Can you ship to Canada?",
    time: "2m ago",
    read: false,
  },
  {
    id: "m2",
    platform: "twitter",
    sender: "@techreviewer",
    initials: "TR",
    content: "Just tested your new feature — really impressed with the UX 🔥",
    time: "15m ago",
    read: false,
  },
  {
    id: "m3",
    platform: "linkedin",
    sender: "James Park",
    initials: "JP",
    content: "Great post on the case study. Would love to connect and discuss.",
    time: "1h ago",
    read: true,
  },
  {
    id: "m4",
    platform: "instagram",
    sender: "marco_visuals",
    initials: "MV",
    content: "Amazing shot! What camera did you use for the team photo?",
    time: "2h ago",
    read: true,
  },
  {
    id: "m5",
    platform: "facebook",
    sender: "Emily Chen",
    initials: "EC",
    content: "When is the product going to be available in Europe?",
    time: "3h ago",
    read: true,
  },
  {
    id: "m6",
    platform: "twitter",
    sender: "@designdaily",
    initials: "DD",
    content: "Check out @AcmeCorp's new landing page — solid work on the redesign!",
    time: "4h ago",
    read: true,
  },
];

export const MOCK_ACTIVITY: MockActivityItem[] = [
  {
    id: "a1",
    type: "like",
    platform: "instagram",
    actor: "sarah.jones",
    initials: "SJ",
    content: "liked your post",
    post: "New product launch 🚀",
    time: "2m ago",
    ts: 202604291000,
  },
  {
    id: "a2",
    type: "comment",
    platform: "twitter",
    actor: "@techreviewer",
    initials: "TR",
    content: 'commented: "Really impressed with the UX 🔥"',
    post: "Q1 results breakdown thread",
    time: "8m ago",
    ts: 202604290900,
  },
  {
    id: "a3",
    type: "share",
    platform: "linkedin",
    actor: "James Park",
    initials: "JP",
    content: "shared your post",
    post: "Case study: 3× growth in 6 months",
    time: "22m ago",
    ts: 202604290800,
  },
  {
    id: "a4",
    type: "comment",
    platform: "instagram",
    actor: "marco_visuals",
    initials: "MV",
    content: 'commented: "Amazing shot! What camera? 📷"',
    post: "Behind the scenes offsite",
    time: "45m ago",
    ts: 202604290600,
  },
  {
    id: "a5",
    type: "like",
    platform: "facebook",
    actor: "Emily Chen",
    initials: "EC",
    content: "liked your post",
    post: "New product launch 🚀",
    time: "1h ago",
    ts: 202604290400,
  },
  {
    id: "a6",
    type: "comment",
    platform: "twitter",
    actor: "@designdaily",
    initials: "DD",
    content: 'commented: "Solid work on the redesign!"',
    post: "Q1 results breakdown thread",
    time: "2h ago",
    ts: 202604280800,
  },
  {
    id: "a7",
    type: "share",
    platform: "instagram",
    actor: "lucia.brand",
    initials: "LB",
    content: "shared your post",
    post: "Behind the scenes offsite",
    time: "3h ago",
    ts: 202604280600,
  },
  {
    id: "a8",
    type: "like",
    platform: "linkedin",
    actor: "David Wu",
    initials: "DW",
    content: "liked your post",
    post: "Case study: 3× growth in 6 months",
    time: "4h ago",
    ts: 202604280400,
  },
  {
    id: "a9",
    type: "mention",
    platform: "twitter",
    actor: "@saasdaily",
    initials: "SD",
    content: 'mentioned you: "@AcmeCorp doing great things!"',
    post: null,
    time: "5h ago",
    ts: 202604280200,
  },
  {
    id: "a10",
    type: "comment",
    platform: "facebook",
    actor: "Priya Nair",
    initials: "PN",
    content: 'commented: "When is this available in India?"',
    post: "New product launch 🚀",
    time: "6h ago",
    ts: 202604280000,
  },
  {
    id: "a11",
    type: "share",
    platform: "linkedin",
    actor: "Tom Fischer",
    initials: "TF",
    content: "shared your post",
    post: "How we scaled content ops",
    time: "8h ago",
    ts: 202604271600,
  },
  {
    id: "a12",
    type: "like",
    platform: "instagram",
    actor: "anna.creates",
    initials: "AC",
    content: "liked your post",
    post: "Spring collection is live 🛍️",
    time: "10h ago",
    ts: 202604271200,
  },
  {
    id: "a13",
    type: "mention",
    platform: "instagram",
    actor: "@fashionweekly",
    initials: "FW",
    content: "mentioned you in a story",
    post: null,
    time: "12h ago",
    ts: 202604270800,
  },
  {
    id: "a14",
    type: "comment",
    platform: "youtube",
    actor: "Pedro Santos",
    initials: "PS",
    content: 'commented: "Great content, subscribed!"',
    post: "Thanks for joining our AMA",
    time: "1d ago",
    ts: 202604261200,
  },
  {
    id: "a15",
    type: "share",
    platform: "twitter",
    actor: "@mktgnews",
    initials: "MN",
    content: "retweeted your post",
    post: "Q1 results breakdown thread",
    time: "1d ago",
    ts: 202604260900,
  },
];

export type MockAnalyticsData = {
  followers: number;
  impressions: number;
  reach: number;
  engagement: number;
  growth: number[];
  topPosts: { content: string; likes: number; comments: number; reach: number }[];
};

export const MOCK_ANALYTICS: Record<Platform, MockAnalyticsData> = {
  instagram: {
    followers: 24600,
    impressions: 142300,
    reach: 89400,
    engagement: 4.2,
    growth: [22100, 22800, 23200, 23500, 23900, 24100, 24600],
    topPosts: [
      { content: "Behind the scenes at our team offsite", likes: 892, comments: 43, reach: 12400 },
      { content: "New product launch announcement 🚀", likes: 654, comments: 28, reach: 8900 },
      {
        content: "Meet the team — say hello to our new hires!",
        likes: 412,
        comments: 61,
        reach: 6200,
      },
    ],
  },
  twitter: {
    followers: 18200,
    impressions: 98700,
    reach: 54200,
    engagement: 2.8,
    growth: [16900, 17200, 17500, 17800, 18000, 18100, 18200],
    topPosts: [
      { content: "Q1 results breakdown thread 🧵", likes: 321, comments: 89, reach: 7800 },
      { content: "We're hiring engineers and designers", likes: 214, comments: 34, reach: 4200 },
      {
        content: "Hot take: design systems save more time…",
        likes: 189,
        comments: 52,
        reach: 3600,
      },
    ],
  },
  linkedin: {
    followers: 8900,
    impressions: 56200,
    reach: 38100,
    engagement: 5.1,
    growth: [8200, 8300, 8400, 8500, 8650, 8800, 8900],
    topPosts: [
      {
        content: "Case study: how we grew a client 3× in 6 months",
        likes: 142,
        comments: 18,
        reach: 3200,
      },
      {
        content: "Lessons from building a remote-first team",
        likes: 98,
        comments: 24,
        reach: 2100,
      },
      { content: "Open roles at Acme — join a great team", likes: 67, comments: 9, reach: 1800 },
    ],
  },
  facebook: {
    followers: 31400,
    impressions: 78400,
    reach: 51200,
    engagement: 3.4,
    growth: [29800, 30100, 30400, 30700, 30900, 31200, 31400],
    topPosts: [
      { content: "Just dropped: Spring collection 🛍️", likes: 1204, comments: 87, reach: 24300 },
      { content: "Thanks for joining our live AMA", likes: 198, comments: 52, reach: 6100 },
      { content: "Our latest case study is live", likes: 142, comments: 18, reach: 3200 },
    ],
  },
  threads: {
    followers: 5100,
    impressions: 18200,
    reach: 12400,
    engagement: 3.1,
    growth: [4400, 4600, 4750, 4850, 4950, 5050, 5100],
    topPosts: [
      { content: "Hot takes from a creative director", likes: 89, comments: 12, reach: 2100 },
    ],
  },
  tiktok: {
    followers: 42800,
    impressions: 312400,
    reach: 198200,
    engagement: 6.8,
    growth: [38200, 39100, 40000, 40800, 41500, 42100, 42800],
    topPosts: [
      { content: "Day in the life — design team", likes: 4210, comments: 312, reach: 84000 },
    ],
  },
  youtube: {
    followers: 12300,
    impressions: 87100,
    reach: 51200,
    engagement: 4.9,
    growth: [11400, 11600, 11800, 12000, 12100, 12200, 12300],
    topPosts: [{ content: "AMA recording — full video", likes: 198, comments: 52, reach: 6100 }],
  },
};

/** Calendar fixture: April 2026 starts on a Wednesday. */
export const MOCK_CALENDAR_POSTS: Record<number, { platform: Platform; status: PostStatus }[]> = {
  26: [{ platform: "instagram", status: "published" }],
  27: [
    { platform: "linkedin", status: "published" },
    { platform: "facebook", status: "published" },
  ],
  29: [
    { platform: "instagram", status: "scheduled" },
    { platform: "twitter", status: "scheduled" },
  ],
  30: [
    { platform: "twitter", status: "scheduled" },
    { platform: "linkedin", status: "scheduled" },
  ],
};
