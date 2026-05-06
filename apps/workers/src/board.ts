import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import express, { type NextFunction, type Request, type Response } from "express";
import { redis } from "./redis";

const QUEUE_NAMES = ["post-publish", "token-refresh", "analytics-sync", "inbox-sync"] as const;

const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection: redis }));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");

createBullBoard({
  queues: queues.map((q) => new BullMQAdapter(q)),
  serverAdapter,
});

function basicAuth(req: Request, res: Response, next: NextFunction) {
  const user = process.env.BOARD_USER;
  const pass = process.env.BOARD_PASS;

  if (!user || !pass) {
    next();
    return;
  }

  const header = req.headers.authorization ?? "";
  const b64 = header.replace(/^Basic\s+/, "");
  const [reqUser, reqPass] = Buffer.from(b64, "base64").toString().split(":");

  if (reqUser === user && reqPass === pass) {
    next();
    return;
  }

  res.set("WWW-Authenticate", 'Basic realm="Bull Board"');
  res.status(401).send("Unauthorized");
}

const app = express();
app.use(basicAuth);
app.use("/", serverAdapter.getRouter());

export function startBoard(port: number) {
  app.listen(port, () => {
    console.log(`Bull Board running at http://localhost:${port}`);
  });
}

export async function closeBoard() {
  await Promise.all(queues.map((q) => q.close()));
}
