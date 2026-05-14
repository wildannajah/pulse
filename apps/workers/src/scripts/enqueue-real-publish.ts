/**
 * Enqueue a real post-publish job from a live PostPublication row.
 *
 * Usage:
 *   DATABASE_URL=<url> REDIS_URL=<url> tsx src/scripts/enqueue-real-publish.ts <publicationId>
 *
 * Requirements:
 *   - The PostPublication row must exist and have status SCHEDULED.
 *   - The associated ConnectedAccount must have status ACTIVE.
 *   - The associated Post must have non-empty content.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

const publicationId = process.argv[2];
if (!publicationId) {
  console.error("Usage: tsx src/scripts/enqueue-real-publish.ts <publicationId>");
  process.exit(1);
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is required");

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const prisma = new PrismaClient();
const postPublishQueue = new Queue("post-publish", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

async function main() {
  const publication = await prisma.postPublication.findUnique({
    where: { id: publicationId },
    include: {
      post: { select: { id: true, brandId: true, content: true } },
      connectedAccount: {
        select: { id: true, platform: true, status: true, platformUsername: true },
      },
    },
  });

  if (!publication) {
    console.error(`PostPublication ${publicationId} not found`);
    process.exit(1);
  }

  console.log("Found publication:");
  console.log(`  id:       ${publication.id}`);
  console.log(`  status:   ${publication.status}`);
  console.log(`  platform: ${publication.connectedAccount.platform}`);
  console.log(`  account:  @${publication.connectedAccount.platformUsername}`);
  console.log(`  content:  ${publication.post.content.slice(0, 80)}…`);

  if (publication.connectedAccount.status !== "ACTIVE") {
    console.error(
      `Connected account status is ${publication.connectedAccount.status} — must be ACTIVE`,
    );
    process.exit(1);
  }

  const platform = publication.connectedAccount.platform.toLowerCase() as "twitter";
  const idempotencyKey = `post-publish:${publication.id}`;

  const job = await postPublishQueue.add(
    "real-publish",
    {
      brandId: publication.post.brandId,
      postId: publication.post.id,
      publicationId: publication.id,
      platform,
      idempotencyKey,
    },
    { jobId: idempotencyKey },
  );

  console.log(`\nEnqueued job ${job.id} on queue "post-publish"`);
  console.log("Watch worker logs for:", idempotencyKey);

  await postPublishQueue.close();
  await connection.quit();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
