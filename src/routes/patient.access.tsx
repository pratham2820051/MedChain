import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, grantAccess, revokeAccess, shortAddr } from "@/lib/mock-store";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldOff } from "lucide-react";

export const Route = createFileRoute("/patient/access")({
  head: () => ({ meta: [{ title: "Access Management — MedChain" }] }),
  component: AccessPage,
});

function AccessPage() {
  const grants = useStore((s) => s.grants);
  const [addr, setAddr] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr || !expiry) { toast.error("Doctor address and expiry required."); return; }
    setBusy(true);
    try {
      await grantAccess(addr, expiry);
      toast.success("Access granted");
      setAddr(""); setExpiry("");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Access Management" description="Grant or revoke doctor access to your records." />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass p-6">
          <h2 className="font-semibold mb-3">Grant Access</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="addr">Doctor Wallet Address</Label>
              <Input id="addr" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x…" className="font-mono" />
            </div>
            <div>
              <Label htmlFor="exp">Access Expiry Date</Label>
              <Input id="exp" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="bg-hero text-primary-foreground">Grant Access</Button>
          </form>
        </Card>
        <Card className="glass p-6">
          <h2 className="font-semibold mb-3">Active Access</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Doctor</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {grants.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{shortAddr(g.doctorAddress)}</TableCell>
                    <TableCell>{g.expiryDate}</TableCell>
                    <TableCell><span className={`text-xs rounded-full px-2 py-0.5 ${g.status === "Active" ? "bg-accent/30" : "bg-muted text-muted-foreground"}`}>{g.status}</span></TableCell>
                    <TableCell className="text-right">
                      {g.status === "Active" && (
                        <Button size="sm" variant="outline" onClick={async () => { await revokeAccess(g.id); toast.success("Access revoked"); }}>
                          <ShieldOff className="h-3.5 w-3.5 mr-1" />Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {grants.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No active grants.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
