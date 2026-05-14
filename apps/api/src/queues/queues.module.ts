import { Global, Module } from "@nestjs/common";

import { PostPublishQueueService } from "./post-publish-queue.service";

@Global()
@Module({
  providers: [PostPublishQueueService],
  exports: [PostPublishQueueService],
})
export class QueuesModule {}
