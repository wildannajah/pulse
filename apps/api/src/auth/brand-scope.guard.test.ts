import { BadRequestException, type ExecutionContext, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { BrandScopeGuard } from "./brand-scope.guard";

function createMockContext(
  headers: Record<string, string | undefined>,
  user?: { id: string },
): ExecutionContext {
  const request: Record<string, unknown> = { headers, user };
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

const mockBrand = {
  id: "brand-1",
  name: "Test Brand",
  workspaceId: "workspace-1",
  workspace: { id: "workspace-1" },
};

function createMockPrisma(brandResult: unknown, memberResult: unknown) {
  return {
    brand: {
      findUnique: vi.fn().mockResolvedValue(brandResult),
    },
    workspaceMember: {
      findUnique: vi.fn().mockResolvedValue(memberResult),
    },
  } as unknown as ConstructorParameters<typeof BrandScopeGuard>[0];
}

describe("BrandScopeGuard", () => {
  it("allows request with valid brand and membership", async () => {
    const prisma = createMockPrisma(mockBrand, {
      id: "member-1",
      workspaceId: "workspace-1",
      userId: "user-1",
      role: "OWNER",
      brandAccess: [],
    });
    const guard = new BrandScopeGuard(prisma);
    const context = createMockContext({ "x-brand-id": "brand-1" }, { id: "user-1" });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect((request as Record<string, unknown>).brand).toEqual(mockBrand);
  });

  it("rejects request with missing x-brand-id header", async () => {
    const prisma = createMockPrisma(null, null);
    const guard = new BrandScopeGuard(prisma);
    const context = createMockContext({}, { id: "user-1" });

    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it("rejects request when brand is not found", async () => {
    const prisma = createMockPrisma(null, null);
    const guard = new BrandScopeGuard(prisma);
    const context = createMockContext({ "x-brand-id": "nonexistent" }, { id: "user-1" });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("rejects cross-tenant access (user not in workspace)", async () => {
    const prisma = createMockPrisma(mockBrand, null); // No membership
    const guard = new BrandScopeGuard(prisma);
    const context = createMockContext(
      { "x-brand-id": "brand-1" },
      { id: "user-2" }, // Different user
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("rejects when brand is not in user's brandAccess list", async () => {
    const prisma = createMockPrisma(mockBrand, {
      id: "member-1",
      workspaceId: "workspace-1",
      userId: "user-1",
      role: "EDITOR",
      brandAccess: ["brand-other"], // brand-1 not in list
    });
    const guard = new BrandScopeGuard(prisma);
    const context = createMockContext({ "x-brand-id": "brand-1" }, { id: "user-1" });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
