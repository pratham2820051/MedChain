import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, markAllRead } from "@/lib/mock-store";
import { Bell, CheckCheck, ShieldOff, FilePlus } from "lucide-react";

export const Route = createFileRoute("/doctor/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MedChain" }] }),
  component: NotificationsPage,
});

const iconFor = (t: string) => t === "Access Approved" ? CheckCheck : t === "Access Revoked" ? ShieldOff : FilePlus;

function NotificationsPage() {
  const items = useStore((s) => s.notifications);

  return (
    <div>
      <PageHeader title="Notifications" action={<Button variant="outline" onClick={markAllRead}><Bell className="h-4 w-4 mr-2" />Mark all read</Button>} />
      <Card className="glass divide-y divide-border">
        {items.map((n) => {
          const Icon = iconFor(n.type);
          return (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? "bg-primary/5" : ""}`}>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="text-sm font-medium">{n.type}</div>
                <div className="text-sm text-muted-foreground">{n.message}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleString()}</div>
              </div>
              {!n.read && <span className="h-2 w-2 rounded-full bg-accent mt-2" />}
            </div>
          );
        })}
        {items.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No notifications.</div>}
      </Card>
    </div>
  );
}
