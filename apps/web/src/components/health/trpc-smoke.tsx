"use client";

import { useEffect } from "react";

import { trpc } from "@/lib/trpc/trpc";
import { useBrandStore } from "@/stores/brand-store";

type TrpcSmokeProps = {
  initialBrandId: string | null;
};

export function TrpcSmoke({ initialBrandId }: TrpcSmokeProps) {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrandId = useBrandStore((s) => s.setActiveBrandId);

  useEffect(() => {
    if (!activeBrandId && initialBrandId) {
      setActiveBrandId(initialBrandId);
    }
  }, [activeBrandId, initialBrandId, setActiveBrandId]);

  const meQuery = trpc.health.me.useQuery();
  const brandQuery = trpc.health.brand.useQuery(undefined, {
    enabled: Boolean(activeBrandId),
  });

  return (
    <div className="space-y-6 p-8">
      <h1 className="font-semibold text-2xl">tRPC smoke test</h1>

      <section className="rounded-lg border p-4">
        <h2 className="font-medium text-lg">trpc.health.me</h2>
        <p className="text-muted-foreground text-sm">protectedProcedure — session only</p>
        <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">
          {meQuery.isPending && "Loading..."}
          {meQuery.isError && `Error: ${meQuery.error.message}`}
          {meQuery.data && JSON.stringify(meQuery.data, null, 2)}
        </pre>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="font-medium text-lg">trpc.health.brand</h2>
        <p className="text-muted-foreground text-sm">
          brandProcedure — session + x-brand-id (active brand id:{" "}
          <code className="text-xs">{activeBrandId ?? "null"}</code>)
        </p>
        <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">
          {!activeBrandId && "Waiting for active brand id..."}
          {activeBrandId && brandQuery.isPending && "Loading..."}
          {brandQuery.isError && `Error: ${brandQuery.error.message}`}
          {brandQuery.data && JSON.stringify(brandQuery.data, null, 2)}
        </pre>
      </section>

      <button
        type="button"
        className="rounded border px-3 py-1 text-sm"
        onClick={() => {
          setActiveBrandId(null);
          void brandQuery.refetch();
        }}
      >
        Clear active brand (expect BAD_REQUEST on refetch)
      </button>
    </div>
  );
}
