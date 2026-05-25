import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ShieldCheck, Activity, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { connectWallet, setRole, shortAddr, useStore, type UserRole } from "@/lib/mock-store";
import { toast } from "sonner";

export const Route = createFileRoute("/connect")({
  head: () => ({ meta: [{ title: "Connect Wallet — MedChain" }, { name: "description", content: "Connect your wallet and choose your role." }] }),
  component: ConnectPage,
});

function ConnectPage() {
  const wallet = useStore((s) => s.wallet);
  const [connecting, setConnecting] = useState(false);
  const [chosen, setChosen] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  const onConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
      toast.success("Wallet connected");
    } finally {
      setConnecting(false);
    }
  };

  const onContinue = () => {
    if (!chosen) return;
    setRole(chosen);
    navigate({ to: chosen === "patient" ? "/patient/dashboard" : "/doctor/dashboard" });
  };

  return (
    <div className="min-h-screen bg-soft flex flex-col">
      <header className="px-6 lg:px-12 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-hero flex items-center justify-center text-primary-foreground"><Activity className="h-5 w-5" /></div>
          <span className="font-semibold text-lg">MedChain</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="glass p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-hero mx-auto flex items-center justify-center text-primary-foreground shadow-card mb-4">
              <Wallet className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold">Connect your wallet</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in securely to access your records.</p>
          </div>

          {!wallet ? (
            <Button className="w-full bg-hero text-primary-foreground hover:opacity-95" size="lg" onClick={onConnect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl bg-secondary/60 p-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <div className="text-sm">
                  <div className="font-medium">Connected</div>
                  <div className="text-muted-foreground font-mono text-xs">{shortAddr(wallet)}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Select your role</div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: "patient" as const, label: "Patient", icon: User },
                    { id: "doctor" as const, label: "Doctor", icon: Stethoscope },
                  ]).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setChosen(r.id)}
                      className={`rounded-xl border p-4 text-left transition ${chosen === r.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}
                    >
                      <r.icon className="h-5 w-5 mb-2 text-primary" />
                      <div className="font-medium text-sm">{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={onContinue} className="w-full" disabled={!chosen}>Continue</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
