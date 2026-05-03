import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/app/sidebar";
import { auth } from "@/lib/auth/auth-config";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  const user = {
    name: session.user.name ?? session.user.email ?? "User",
    email: session.user.email ?? "",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-secondary">
      <Sidebar user={user} />
      <main className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}
