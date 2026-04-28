import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth-config";

export default async function AppPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Pulse Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {session.user?.name ?? session.user?.email}</p>
    </main>
  );
}
