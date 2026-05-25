import { createFileRoute, Link } from "@tanstack/react-router";
import { StatsCard, PageHeader } from "@/components/stats-card";
import { useStore } from "@/lib/mock-store";
import { FileText, ShieldCheck, Upload, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/patient/dashboard")({
  head: () => ({ meta: [{ title: "Patient Dashboard — MedChain" }] }),
  component: Dashboard,
});

function Dashboard() {
  const records = useStore((s) => s.records);
  const grants = useStore((s) => s.grants).filter((g) => g.status === "Active");
  const audit = useStore((s) => s.audit);
  const recent = records.slice(0, 3);

  return (
    <div>
      <PageHeader title="Welcome back" description="Here's a snapshot of your health data." action={<Button asChild className="bg-hero text-primary-foreground"><Link to="/patient/upload">Upload Record</Link></Button>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Records" value={records.length} icon={<FileText className="h-5 w-5" />} accent="primary" />
        <StatsCard label="Active Access Grants" value={grants.length} icon={<ShieldCheck className="h-5 w-5" />} accent="accent" />
        <StatsCard label="Recent Uploads" value={records.filter(r => new Date(r.uploadDate) > new Date(Date.now() - 30*864e5)).length} icon={<Upload className="h-5 w-5" />} accent="chart-3" />
        <StatsCard label="Audit Events" value={audit.length} icon={<ScrollText className="h-5 w-5" />} accent="chart-5" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Records</h2>
            <Link to="/patient/records" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.type} · {r.uploadDate}</div>
                </div>
                <span className="text-xs rounded-full bg-accent/30 px-2 py-0.5">{r.status}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link to="/patient/audit" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border">
            {audit.slice(0, 4).map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{a.eventType}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</div>
                </div>
                <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{a.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
