"use client";

import type { Platform } from "@pulse/types/platform";
import { PLATFORM_LABELS } from "@pulse/types/platform";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { PlatformConnectionCard } from "@/components/settings/platform-connection-card";
import { trpc } from "@/lib/trpc/trpc";

const PLATFORMS: { platform: Platform; enabled: boolean }[] = [
  { platform: "twitter", enabled: true },
  { platform: "instagram", enabled: false },
  { platform: "facebook", enabled: false },
  { platform: "linkedin", enabled: false },
  { platform: "threads", enabled: false },
  { platform: "tiktok", enabled: false },
  { platform: "youtube", enabled: false },
];

function getErrorMessage(reason: string | null, platform: string): string {
  switch (reason) {
    case "platform_denied":
      return `${platform} denied access. Try again?`;
    case "invalid_state":
    case "missing_params":
    case "platform_mismatch":
      return "OAuth session expired. Please try again.";
    case "exchange_failed":
      return `${platform} token exchange failed. Try again.`;
    default:
      return "Connection failed. Please try again.";
  }
}

export function ConnectionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);

  const listQuery = trpc.connectedAccount.list.useQuery();

  const startOAuth = trpc.connectedAccount.startOAuth.useMutation({
    onSuccess: ({ authorizationUrl }) => {
      window.location.href = authorizationUrl;
    },
  });

  const disconnect = trpc.connectedAccount.disconnect.useMutation({
    onSuccess: () => {
      listQuery.refetch();
    },
  });

  useEffect(() => {
    if (toastShownRef.current) return;
    const status = searchParams.get("status");
    if (!status) return;

    toastShownRef.current = true;
    const platform = searchParams.get("platform") ?? "Platform";
    const account = searchParams.get("account");
    const reason = searchParams.get("reason");

    if (status === "success" && account) {
      toast.success(`Connected @${account}`);
    } else {
      toast.error(getErrorMessage(reason, platform));
    }

    router.replace("/app/settings/connections");
  }, [searchParams, router]);

  const accounts = listQuery.data ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Connected accounts">
        <span className="text-[12px] text-muted-foreground">
          Connect your social accounts to start publishing
        </span>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-7">
        <div className="grid gap-3">
          {PLATFORMS.map(({ platform, enabled }) => {
            const account = accounts.find((a) => a.platform === platform) ?? null;
            return (
              <PlatformConnectionCard
                key={platform}
                platform={platform}
                platformName={PLATFORM_LABELS[platform]}
                account={account}
                onConnect={() => startOAuth.mutate({ platform })}
                onDisconnect={(id) => disconnect.mutate({ connectedAccountId: id })}
                isConnecting={startOAuth.isPending && startOAuth.variables?.platform === platform}
                isDisconnecting={
                  disconnect.isPending && disconnect.variables?.connectedAccountId === account?.id
                }
                disabled={!enabled}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
