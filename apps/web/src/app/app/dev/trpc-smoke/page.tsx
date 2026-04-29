import { redirect } from "next/navigation";

import { TrpcSmoke } from "@/components/health/trpc-smoke";
import { auth } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";

export default async function TrpcSmokePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const firstBrand = await prisma.brand.findFirst({
    where: {
      workspace: {
        members: { some: { userId: session.user.id } },
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return <TrpcSmoke initialBrandId={firstBrand?.id ?? null} />;
}
