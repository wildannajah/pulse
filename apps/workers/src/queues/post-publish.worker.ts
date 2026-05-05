import type { PostPublishJob } from "@pulse/types/event-types";
import { type Job, Worker } from "bullmq";

import { redis } from "../redis";

export const postPublishWorker = new Worker<PostPublishJob>(
  "post-publish",
  async (job: Job<PostPublishJob>) => {
    console.log(`[post-publish] processing ${job.id}`, {
      brandId: job.data.brandId,
      publicationId: job.data.publicationId,
      platform: job.data.platform,
      idempotencyKey: job.data.idempotencyKey,
    });
    // TODO: dispatch via getAdapter(job.data.platform).publish(...)
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
