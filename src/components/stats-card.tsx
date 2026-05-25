import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  icon,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "primary" | "accent" | "chart-3" | "chart-5";
  className?: string;
}) {
  const color = accent ?? "primary";
  return (
    <Card className={cn("glass p-5 flex items-center gap-4", className)}>
      <div
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center text-primary-foreground shrink-0",
          color === "primary" && "bg-primary",
          color === "accent" && "bg-accent text-accent-foreground",
          color === "chart-3" && "bg-chart-3",
          color === "chart-5" && "bg-chart-5",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
      </div>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
