import "dotenv/config";
import { postPublishWorker } from "./queues/post-publish.worker";
import { redis } from "./redis";

const workers = [postPublishWorker];

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down workers…`);
  await Promise.all(workers.map((w) => w.close()));
  await redis.quit();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

console.log("Workers running:", workers.map((w) => w.name).join(", "));
