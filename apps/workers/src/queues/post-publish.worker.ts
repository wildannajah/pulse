import { type Job, Worker } from "bullmq";

import { redis } from "../redis";

export type PostPublishJob = {
  brandId: string;
  postId: string;
};

export const postPublishWorker = new Worker<PostPublishJob>(
  "post-publish",
  async (job: Job<PostPublishJob>) => {
    console.log(`[post-publish] processing job ${job.id}`, job.data);
    return { ok: true };
  },
  { connection: redis },
);

postPublishWorker.on("completed", (job) => {
  console.log(`[post-publish] completed ${job.id}`);
});

postPublishWorker.on("failed", (job, err) => {
  console.error(`[post-publish] failed ${job?.id}`, err);
});
