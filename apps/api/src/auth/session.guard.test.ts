import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { SessionGuard } from "./session.guard";

function createMockContext(headers: Record<string, string | undefined>): ExecutionContext {
  const request: Record<string, unknown> = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getClass: () => ({}),
    getHandler: () => ({}),
    getArgs: () => [],
    getArgByIndex: () => ({}),
    switchToRpc: () => ({}) as ReturnType<ExecutionContext["switchToRpc"]>,
    switchToWs: () => ({}) as ReturnType<ExecutionContext["switchToWs"]>,
    getType: () => "http" as const,
  } as unknown as ExecutionContext;
}

function createMockPrisma(sessionResult: unknown) {
  return {
    session: {
      findUnique: vi.fn().mockResolvedValue(sessionResult),
    },
  } as unknown as ConstructorParameters<typeof SessionGuard>[0];
}

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
};

describe("SessionGuard", () => {
  it("allows request with valid session token", async () => {
    const prisma = createMockPrisma({
      id: "session-1",
      sessionToken: "valid-token",
      expiresAt: new Date(Date.now() + 86400000),
      user: mockUser,
    });
    const guard = new SessionGuard(prisma);
    const context = createMockContext({ authorization: "Bearer valid-token" });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect((request as Record<string, unknown>).user).toEqual(mockUser);
  });

  it("rejects request with missing authorization header", async () => {
    const prisma = createMockPrisma(null);
    const guard = new SessionGuard(prisma);
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects request with malformed authorization header", async () => {
    const prisma = createMockPrisma(null);
    const guard = new SessionGuard(prisma);
    const context = createMockContext({ authorization: "Token abc123" });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects request when session token is not found", async () => {
    const prisma = createMockPrisma(null);
    const guard = new SessionGuard(prisma);
    const context = createMockContext({ authorization: "Bearer nonexistent" });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects request with expired session", async () => {
    const prisma = createMockPrisma({
      id: "session-1",
      sessionToken: "expired-token",
      expiresAt: new Date(Date.now() - 86400000), // Expired yesterday
      user: mockUser,
    });
    const guard = new SessionGuard(prisma);
    const context = createMockContext({ authorization: "Bearer expired-token" });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
