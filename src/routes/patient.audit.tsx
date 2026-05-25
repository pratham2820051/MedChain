import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore, shortAddr, type AuditEvent } from "@/lib/mock-store";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/patient/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — MedChain" }] }),
  component: AuditPage,
});

const eventTypes: (AuditEvent["eventType"] | "All")[] = [
  "All",
  "Upload",
  "Grant",
  "Revoke",
  "View",
  "Download",
  "Request",
];

function AuditPage() {
  const audit = useStore((s) => s.audit);
  const [q, setQ] = useState("");
  const [type, setType] = useState<AuditEvent["eventType"] | "All">("All");

  const filtered = useMemo(
    () =>
      audit.filter(
        (a) =>
          (type === "All" || a.eventType === type) &&
          (a.walletAddress.toLowerCase().includes(q.toLowerCase()) ||
            a.txId.toLowerCase().includes(q.toLowerCase()) ||
            a.eventType.toLowerCase().includes(q.toLowerCase())),
      ),
    [audit, q, type],
  );

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Immutable record of every action on your data."
      />
      <Card className="glass p-4">
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events"
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as AuditEvent["eventType"] | "All")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Tx ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.eventType}</TableCell>
                  <TableCell className="font-mono text-xs">{shortAddr(a.walletAddress)}</TableCell>
                  <TableCell>{new Date(a.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{a.txId.slice(0, 12)}…</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${a.status === "Success" ? "bg-accent/30" : a.status === "Pending" ? "bg-chart-4/30" : "bg-destructive/20 text-destructive"}`}
                    >
                      {a.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No events.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
