import "dotenv/config";
import { closeBoard, startBoard } from "./board";
import { postPublishWorker } from "./queues/post-publish.worker";
import { redis } from "./redis";

// BOARD_PORT wins so workers can't accidentally collide with the API (which uses PORT=3001).
// PORT is kept as a fallback so platforms that inject it (Railway, Heroku, Fly) still work.
const BOARD_PORT = Number(process.env.BOARD_PORT ?? process.env.PORT ?? 3002);
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
