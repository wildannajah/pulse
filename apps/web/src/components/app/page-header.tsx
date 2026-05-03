import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-7 py-5">
      <h1 className="font-semibold text-[17px] tracking-tight">{title}</h1>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </header>
  );
}
