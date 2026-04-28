import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Pulse</h1>
      <p className="text-muted-foreground">Multi-tenant social media management platform</p>
      <Button>Get started</Button>
    </main>
  );
}
