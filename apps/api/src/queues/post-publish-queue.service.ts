import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

import { RedisService } from "../redis/redis.service";
import type { PostPublishJob } from "./queue-types";

@Injectable()
export class PostPublishQueueService implements OnModuleDestroy {
  private readonly queue: Queue<PostPublishJob>;

  constructor(private readonly redis: RedisService) {
    this.queue = new Queue<PostPublishJob>("post-publish", {
      connection: this.redis.client,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    });
  }

  async enqueue(payload: PostPublishJob): Promise<string> {
    const job = await this.queue.add("publish", payload, { jobId: payload.idempotencyKey });
    return job.id ?? payload.idempotencyKey;
  }

  async enqueueMany(payloads: PostPublishJob[]): Promise<string[]> {
    return Promise.all(payloads.map((p) => this.enqueue(p)));
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    // RedisService owns the Redis client lifecycle — no quit() needed here
  }
}
