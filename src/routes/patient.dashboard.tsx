import { createFileRoute, Link } from "@tanstack/react-router";
import { StatsCard, PageHeader } from "@/components/stats-card";
import { useStore } from "@/lib/mock-store";
import { FileText, ShieldCheck, Upload, ScrollText, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useEffect, useState } from "react";
import {
  registerPatient,
  isPatientRegistered,
  getRecordCount,
  parseContractError,
} from "@/services/medchainService";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/dashboard")({
  head: () => ({ meta: [{ title: "Patient Dashboard — MedChain" }] }),
  component: Dashboard,
});

function Dashboard() {
  const records = useStore((s) => s.records);
  const grants = useStore((s) => s.grants).filter((g) => g.status === "Active");
  const audit = useStore((s) => s.audit);
  const recent = records.slice(0, 3);

  const { walletAddress, isConnected, isCorrectNetwork } = useWallet();

  const [registered, setRegistered] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState(false);
  const [chainRecordCount, setChainRecordCount] = useState<number | null>(null);

  // Check registration status on-chain
  useEffect(() => {
    if (!isConnected || !isCorrectNetwork || !walletAddress) return;
    isPatientRegistered(walletAddress)
      .then(setRegistered)
      .catch(() => setRegistered(null));
  }, [isConnected, isCorrectNetwork, walletAddress]);

  // Fetch on-chain record count
  useEffect(() => {
    if (!isConnected || !isCorrectNetwork || !walletAddress || !registered) return;
    getRecordCount(walletAddress)
      .then(setChainRecordCount)
      .catch(() => setChainRecordCount(null));
  }, [isConnected, isCorrectNetwork, walletAddress, registered]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await registerPatient();
      setRegistered(true);
      toast.success("Registered on blockchain!");
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Welcome back"
        description="Here's a snapshot of your health data."
        action={
          <Button asChild className="bg-hero text-primary-foreground">
            <Link to="/patient/upload">Upload Record</Link>
          </Button>
        }
      />

      {/* Register on blockchain banner */}
      {isConnected && isCorrectNetwork && registered === false && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-sm">Register on Blockchain</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Your wallet is not yet registered as a patient on MedChain.
            </div>
          </div>
          <Button
            size="sm"
            className="bg-hero text-primary-foreground shrink-0"
            onClick={handleRegister}
            disabled={registering}
          >
            {registering ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Registering…
              </>
            ) : (
              "Register Patient"
            )}
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Records"
          value={chainRecordCount !== null ? chainRecordCount : records.length}
          icon={<FileText className="h-5 w-5" />}
          accent="primary"
        />
        <StatsCard
          label="Active Access Grants"
          value={grants.length}
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="accent"
        />
        <StatsCard
          label="Recent Uploads"
          value={records.filter((r) => new Date(r.uploadDate) > new Date(Date.now() - 30 * 864e5)).length}
          icon={<Upload className="h-5 w-5" />}
          accent="chart-3"
        />
        <StatsCard
          label="Audit Events"
          value={audit.length}
          icon={<ScrollText className="h-5 w-5" />}
          accent="chart-5"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Records</h2>
            <Link to="/patient/records" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border/40">
            {recent.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.type} · {r.uploadDate}
                  </div>
                </div>
                <span className="text-xs rounded-full bg-accent/30 px-2 py-0.5">{r.status}</span>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                No records uploaded yet.
              </li>
            )}
          </ul>
        </Card>

        <Card className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link to="/patient/audit" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border/40">
            {audit.slice(0, 4).map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{a.eventType}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">
                  {a.status}
                </span>
              </li>
            ))}
            {audit.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                No recent activity logs.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
