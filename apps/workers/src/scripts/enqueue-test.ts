/**
 * Fire one test job per queue so you can verify the worker is alive.
 * Usage: REDIS_URL=<url> tsx src/scripts/enqueue-test.ts
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

import { Queue } from "bullmq";
import { Redis } from "ioredis";

const url = process.env.REDIS_URL;
if (!url) throw new Error("REDIS_URL is required");

const connection = new Redis(url, { maxRetriesPerRequest: null });

const postPublishQueue = new Queue("post-publish", { connection });

async function main() {
  const job = await postPublishQueue.add(
    "test-job",
    {
      brandId: "brand-test-001",
      postId: "post-test-001",
      publicationId: "pub-test-001",
      platform: "twitter",
      idempotencyKey: `post-publish:pub-test-001`,
    },
    { removeOnComplete: 10, removeOnFail: 10 },
  );

  console.log(`Enqueued job ${job.id} on queue "post-publish"`);
  console.log("Watch your worker logs for: [post-publish] processing", job.id);

  await postPublishQueue.close();
  await connection.quit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
