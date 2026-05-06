import "dotenv/config";
import { closeBoard, startBoard } from "./board";
import { postPublishWorker } from "./queues/post-publish.worker";
import { redis } from "./redis";

const BOARD_PORT = Number(process.env.PORT ?? process.env.BOARD_PORT ?? 3001);
const workers = [postPublishWorker];

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down workers…`);
  await Promise.all(workers.map((w) => w.close()));
  await closeBoard();
  await redis.quit();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

startBoard(BOARD_PORT);
console.log("Workers running:", workers.map((w) => w.name).join(", "));
