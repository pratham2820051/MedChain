import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, downloadRecord } from "@/lib/mock-store";
import { Download, Share2, History, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/records/$id")({
  head: () => ({ meta: [{ title: "Record Details — MedChain" }] }),
  component: RecordDetail,
});

function RecordDetail() {
  const { id } = useParams({ from: "/patient/records/$id" });
  const record = useStore((s) => s.records.find((r) => r.id === id));
  const audit = useStore((s) => s.audit.filter((a) => a.eventType === "View" || a.eventType === "Download").slice(0, 6));

  if (!record) {
    return (
      <div>
        <PageHeader title="Record not found" />
        <Button asChild variant="outline"><Link to="/patient/records">Back to records</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={record.name} description={`${record.type} · uploaded ${record.uploadDate}`} action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { downloadRecord(record.id); toast.success("Download started"); }}><Download className="h-4 w-4 mr-2" />Download</Button>
          <Button className="bg-hero text-primary-foreground"><Share2 className="h-4 w-4 mr-2" />Share</Button>
        </div>
      } />
      <Card className="glass p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-7 w-7" /></div>
          <div className="flex-1 grid sm:grid-cols-2 gap-3 text-sm">
            <Info label="Record Type" value={record.type} />
            <Info label="Upload Date" value={record.uploadDate} />
            <Info label="Status" value={record.status} />
            <Info label="File" value={record.fileName ?? "—"} />
            <div className="sm:col-span-2"><Info label="Description" value={record.description ?? "—"} /></div>
          </div>
        </div>
      </Card>

      <Card className="glass p-6 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Access History</h2>
        </div>
        <ul className="divide-y divide-border">
          {audit.map((a) => (
            <li key={a.id} className="py-2 flex items-center justify-between text-sm">
              <span>{a.eventType} · {a.walletAddress.slice(0, 10)}…</span>
              <span className="text-muted-foreground text-xs">{new Date(a.timestamp).toLocaleString()}</span>
            </li>
          ))}
          {audit.length === 0 && <li className="text-sm text-muted-foreground py-2">No access events yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
