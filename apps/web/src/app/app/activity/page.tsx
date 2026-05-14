import { PageHeader } from "@/components/app/page-header";

export default function ActivityPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Activity" />
      <div className="flex flex-1 items-center justify-center p-7">
        <p className="text-[14px] text-muted-foreground">
          Activity feed coming soon — sync workers land in Phase E.
        </p>
      </div>
    </div>
  );
}
