import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatsCard } from "@/components/stats-card";
import { useStore } from "@/lib/mock-store";
import { Users, Clock, FileText, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/doctor/dashboard")({
  head: () => ({ meta: [{ title: "Doctor Dashboard — MedChain" }] }),
  component: DoctorDashboard,
});

function DoctorDashboard() {
  const grants = useStore((s) => s.grants).filter((g) => g.status === "Active");
  const requests = useStore((s) => s.requests);
  const records = useStore((s) => s.records);
  const audit = useStore((s) => s.audit);

  return (
    <div>
      <PageHeader title="Doctor Dashboard" description="Patient data shared with you." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Patients" value={grants.length} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatsCard label="Pending Requests" value={requests.filter((r) => r.status === "Pending").length} icon={<Clock className="h-5 w-5" />} accent="chart-3" />
        <StatsCard label="Available Records" value={records.length} icon={<FileText className="h-5 w-5" />} accent="accent" />
        <StatsCard label="Recent Activity" value={audit.length} icon={<Activity className="h-5 w-5" />} accent="chart-5" />
      </div>
      <Card className="glass p-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Activity</h2>
          <Link to="/doctor/records" className="text-sm text-primary hover:underline">View records</Link>
        </div>
        <ul className="divide-y divide-border">
          {audit.slice(0, 6).map((a) => (
            <li key={a.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{a.eventType}</div>
                <div className="text-xs text-muted-foreground font-mono">{a.walletAddress.slice(0, 14)}…</div>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
