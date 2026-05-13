import { All, Controller, Req, Res } from "@nestjs/common";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { PrismaService } from "../prisma/prisma.service";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { R2Service } from "../storage/r2.service";
import { appRouter } from "./app-router";
import { createTrpcContext } from "./trpc-context";

@Controller("trpc")
export class TrpcController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
  ) {}

  @All("*path")
  async handle(@Req() req: ExpressRequest, @Res() res: ExpressResponse): Promise<void> {
    const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? "http";
    const host = req.headers.host ?? "localhost";
    const url = new URL(req.originalUrl, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (Array.isArray(val)) {
        headers.set(key, val.join(", "));
      } else if (typeof val === "string") {
        headers.set(key, val);
      }
    }

    let body: string | null = null;
    if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const fetchReq = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: fetchReq,
      router: appRouter,
      createContext: () => createTrpcContext({ req: fetchReq, prisma: this.prisma, r2: this.r2 }),
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const responseBody = await response.text();
    res.send(responseBody);
  }
}
