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
import {
  useStore,
  grantAccess as mockGrant,
  revokeAccess as mockRevoke,
  setState,
  shortAddr,
} from "@/lib/mock-store";
import {
  grantAccess as chainGrant,
  revokeAccess as chainRevoke,
  parseContractError,
} from "@/services/medchainService";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldOff, ShieldCheck, Loader2, Bell } from "lucide-react";

export const Route = createFileRoute("/patient/access")({
  head: () => ({ meta: [{ title: "Access Management — MedChain" }] }),
  component: AccessPage,
});

function AccessPage() {
  const grants = useStore((s) => s.grants);
  const requests = useStore((s) => s.requests);
  const wallet = useStore((s) => s.wallet);
  const { walletAddress, isConnected, isCorrectNetwork } = useWallet();

  const [addr, setAddr] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Requests directed TO this patient (where patientAddress matches connected wallet)
  const myAddress = walletAddress ?? wallet ?? "";
  const incomingRequests = requests.filter(
    (r) => r.patientAddress.toLowerCase() === myAddress.toLowerCase()
  );
  const pendingRequests = incomingRequests.filter((r) => r.status === "Pending");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr || !expiry) {
      toast.error("Doctor address and expiry required.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      toast.error("Please enter a valid doctor wallet address (0x followed by 40 hex characters).");
      return;
    }
    setBusy(true);
    try {
      await mockGrant(addr, expiry);
      if (isConnected && isCorrectNetwork) {
        await chainGrant(addr, expiry);
        toast.success("Access granted on blockchain");
      } else {
        toast.success("Access granted locally");
      }
      setAddr("");
      setExpiry("");
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (grantId: string, doctorAddress: string) => {
    try {
      await mockRevoke(grantId);
      if (isConnected && isCorrectNetwork) {
        await chainRevoke(doctorAddress);
        toast.success("Access revoked on blockchain");
      } else {
        toast.success("Access revoked locally");
      }
    } catch (err) {
      toast.error(parseContractError(err));
    }
  };

  // Approve a doctor's request — grant access with 1-year expiry
  const handleApprove = async (requestId: string, doctorAddress: string) => {
    setApprovingId(requestId);
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const expiryStr = expiry.toISOString().slice(0, 10);
    try {
      // Mark request as Approved in store
      setState((s) => ({
        ...s,
        requests: s.requests.map((r) =>
          r.id === requestId ? { ...r, status: "Approved" } : r
        ),
      }));
      // Grant access
      await mockGrant(doctorAddress, expiryStr);
      if (isConnected && isCorrectNetwork) {
        await chainGrant(doctorAddress, expiryStr);
        toast.success("Access approved on blockchain");
      } else {
        toast.success("Access approved");
      }
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setApprovingId(null);
    }
  };

  // Deny a doctor's request
  const handleDeny = (requestId: string) => {
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) =>
        r.id === requestId ? { ...r, status: "Denied" } : r
      ),
    }));
    toast.success("Request denied");
  };

  return (
    <div>
      <PageHeader
        title="Access Management"
        description="Grant or revoke doctor access to your records."
      />

      {/* Incoming doctor requests banner */}
      {pendingRequests.length > 0 && (
        <div className="mb-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 flex items-start gap-3">
          <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm text-yellow-700 dark:text-yellow-400">
              {pendingRequests.length} pending access request{pendingRequests.length > 1 ? "s" : ""}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Doctors are requesting access to your records. Review below.
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Grant Access form */}
        <Card className="glass p-6">
          <h2 className="font-semibold mb-3">Grant Access</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="addr">Doctor Wallet Address</Label>
              <Input
                id="addr"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="0x…"
                className="font-mono"
                required
              />
            </div>
            <div>
              <Label htmlFor="exp">Access Expiry Date</Label>
              <Input
                id="exp"
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
              />
            </div>
            {isConnected && isCorrectNetwork && (
              <p className="text-xs text-muted-foreground">
                ✅ Will write access grant to Sepolia blockchain.
              </p>
            )}
            <Button type="submit" disabled={busy} className="bg-hero text-primary-foreground">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Granting Access…
                </>
              ) : (
                "Grant Access"
              )}
            </Button>
          </form>
        </Card>

        {/* Active Access grants */}
        <Card className="glass p-6">
          <h2 className="font-semibold mb-3">Active Access</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grants.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{shortAddr(g.doctorAddress)}</TableCell>
                    <TableCell>{g.expiryDate}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${
                          g.status === "Active"
                            ? "bg-accent/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {g.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {g.status === "Active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevoke(g.id, g.doctorAddress)}
                        >
                          <ShieldOff className="h-3.5 w-3.5 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {grants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No active grants.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Doctor Requests section */}
      <Card className="glass p-6 mt-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          Doctor Access Requests
          {pendingRequests.length > 0 && (
            <span className="h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Wallet</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{shortAddr(r.doctorAddress)}</TableCell>
                  <TableCell>{r.requestDate}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        r.status === "Approved"
                          ? "bg-accent/30"
                          : r.status === "Pending"
                            ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                            : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "Pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-hero text-primary-foreground"
                          disabled={approvingId === r.id}
                          onClick={() => handleApprove(r.id, r.doctorAddress)}
                        >
                          {approvingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeny(r.id)}
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {incomingRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No doctor requests yet.
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
