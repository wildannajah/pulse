import type { Platform } from "@pulse/types/platform";
import { PlatformIcon } from "@pulse/ui/icons/platform-icon";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ConnectedAccount = {
  id: string;
  platformUsername: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: string;
};

type PlatformConnectionCardProps = {
  platform: Platform;
  platformName: string;
  account?: ConnectedAccount | null;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
  disabled?: boolean;
};

export function PlatformConnectionCard({
  platform,
  platformName,
  account,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
  disabled = false,
}: PlatformConnectionCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        <PlatformIcon platform={platform} size={28} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-foreground">{platformName}</span>
            {disabled ? (
              <Badge variant="secondary" className="text-[10px]">
                Coming soon
              </Badge>
            ) : null}
          </div>
          {!disabled && account ? (
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {account.displayName ? (
                <span className="font-medium text-foreground">{account.displayName}</span>
              ) : null}
              {account.platformUsername ? (
                <span className="ml-1">@{account.platformUsername}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {disabled ? null : !account ? (
          <Button size="sm" onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? <Loader2 size={13} className="animate-spin" /> : null}
            Connect
          </Button>
        ) : account.status === "ACTIVE" ? (
          <>
            {account.avatarUrl ? (
              <Image
                src={account.avatarUrl}
                alt={account.displayName ?? account.platformUsername ?? "avatar"}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDisconnect(account.id)}
              disabled={isDisconnecting}
              className="text-destructive hover:text-destructive"
            >
              {isDisconnecting ? <Loader2 size={13} className="animate-spin" /> : null}
              Disconnect
            </Button>
          </>
        ) : (
          <>
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
              {account.status === "EXPIRED"
                ? "Token expired"
                : account.status === "REVOKED"
                  ? "Access revoked"
                  : "Reconnect needed"}
            </span>
            <Button size="sm" onClick={onConnect} disabled={isConnecting}>
              {isConnecting ? <Loader2 size={13} className="animate-spin" /> : null}
              Reconnect
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
