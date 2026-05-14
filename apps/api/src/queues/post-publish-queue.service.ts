import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

import type { PostPublishJob } from "./queue-types";

@Injectable()
export class PostPublishQueueService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly queue: Queue<PostPublishJob>;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>("REDIS_URL");
    if (!redisUrl) {
      throw new Error("REDIS_URL is required");
    }

    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

    this.queue = new Queue<PostPublishJob>("post-publish", {
      connection: this.redis,
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
    await this.redis.quit();
  }
}
