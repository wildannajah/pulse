import { prisma } from "@/lib/prisma";

export async function bootstrapWorkspace(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.workspaceMember.findFirst({
      where: { userId },
    });

    if (existing) return;

    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

    const slugBase = (user.email.split("@")[0] ?? "user").toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const workspace = await tx.workspace.create({
      data: {
        name: `${user.name}'s Workspace`,
        slug,
        type: "PERSONAL",
        ownerId: userId,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: "OWNER",
      },
    });

    const brandSlug = `${slugBase}-brand-${Date.now().toString(36)}`;

    await tx.brand.create({
      data: {
        workspaceId: workspace.id,
        name: `${user.name}'s Brand`,
        slug: brandSlug,
      },
    });
  });
}
