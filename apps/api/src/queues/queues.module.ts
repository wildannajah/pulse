import { Global, Module } from "@nestjs/common";

import { RedisModule } from "../redis/redis.module";
import { PostPublishQueueService } from "./post-publish-queue.service";

@Global()
@Module({
  imports: [RedisModule],
  providers: [PostPublishQueueService],
  exports: [PostPublishQueueService],
})
export class QueuesModule {}
