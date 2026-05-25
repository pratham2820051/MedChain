import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore, requestAccess, shortAddr } from "@/lib/mock-store";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/doctor/request")({
  head: () => ({ meta: [{ title: "Request Access — MedChain" }] }),
  component: RequestPage,
});

function RequestPage() {
  const requests = useStore((s) => s.requests);
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr) {
      toast.error("Patient address required.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      toast.error(
        "Please enter a valid patient wallet address (0x followed by 40 hex characters).",
      );
      return;
    }
    setBusy(true);
    try {
      await requestAccess(addr);
      toast.success("Request sent");
      setAddr("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Request Access"
        description="Ask a patient to share their medical records with you."
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="addr">Patient Wallet Address</Label>
              <Input
                id="addr"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="0x…"
                className="font-mono"
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="bg-hero text-primary-foreground">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Requesting Access…
                </>
              ) : (
                "Request Access"
              )}
            </Button>
          </form>
        </Card>
        <Card className="glass p-6">
          <h2 className="font-semibold mb-3">Request History</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{shortAddr(r.patientAddress)}</TableCell>
                  <TableCell>{r.requestDate}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${r.status === "Approved" ? "bg-accent/30" : r.status === "Pending" ? "bg-chart-4/30" : "bg-destructive/20 text-destructive"}`}
                    >
                      {r.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
