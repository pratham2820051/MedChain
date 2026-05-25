import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ShieldCheck,
  Activity,
  Stethoscope,
  User,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { setRole, shortAddr, useStore, type UserRole } from "@/lib/mock-store";
import { toast } from "sonner";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect Wallet — MedChain" },
      { name: "description", content: "Connect your MetaMask wallet and choose your role." },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const { walletAddress, isConnected, isCorrectNetwork, connect, switchToSepolia } = useWallet();
  const storeWallet = useStore((s) => s.wallet);
  const [connecting, setConnecting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [chosen, setChosen] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  // Sync real wallet address into mock-store so layout guards work
  useEffect(() => {
    if (walletAddress && walletAddress !== storeWallet) {
      import("@/lib/mock-store-internal").then(({ setState: _setState }) => {
        _setState((s) => ({ ...s, wallet: walletAddress }));
      });
    }
  }, [walletAddress, storeWallet]);

  const displayAddress = walletAddress ?? storeWallet;

  const onConnect = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not installed. Please install it from metamask.io");
      return;
    }
    setConnecting(true);
    try {
      const addr = await connect();
      // Sync into mock-store for backward-compat with existing pages
      const { setState: _setState } = await import("@/lib/mock-store-internal");
      _setState((s) => ({ ...s, wallet: addr }));
      toast.success("Wallet connected");
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e.code === 4001) {
        toast.error("Connection rejected.");
      } else {
        toast.error(e.message ?? "Failed to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  };

  const onSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await switchToSepolia();
      toast.success("Switched to Sepolia Testnet");
    } catch {
      toast.error("Failed to switch network.");
    } finally {
      setSwitching(false);
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
          <div className="h-9 w-9 rounded-xl bg-hero flex items-center justify-center text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
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
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with MetaMask on Sepolia Testnet.
            </p>
          </div>

          {/* MetaMask not installed */}
          {!window.ethereum && (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                MetaMask is not installed.{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium"
                >
                  Install it here
                </a>
                .
              </span>
            </div>
          )}

          {!isConnected ? (
            <Button
              className="w-full bg-hero text-primary-foreground hover:opacity-95"
              size="lg"
              onClick={onConnect}
              disabled={connecting || !window.ethereum}
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect MetaMask"
              )}
            </Button>
          ) : (
            <div className="space-y-5">
              {/* Connected address */}
              <div className="rounded-xl bg-secondary/60 p-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <div className="text-sm">
                  <div className="font-medium">Connected</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {shortAddr(displayAddress)}
                  </div>
                </div>
              </div>

              {/* Wrong network warning */}
              {!isCorrectNetwork && (
                <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Wrong network.</span> Please switch to Sepolia
                    Testnet.
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-yellow-500/50"
                    onClick={onSwitchNetwork}
                    disabled={switching}
                  >
                    {switching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Switch"}
                  </Button>
                </div>
              )}

              {/* Role selection — only show when on correct network */}
              {isCorrectNetwork && (
                <>
                  <div>
                    <div className="text-sm font-medium mb-2">Select your role</div>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { id: "patient" as const, label: "Patient", icon: User },
                          { id: "doctor" as const, label: "Doctor", icon: Stethoscope },
                        ] as const
                      ).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setChosen(r.id)}
                          className={`rounded-xl border p-4 text-left transition ${
                            chosen === r.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-secondary/40"
                          }`}
                        >
                          <r.icon className="h-5 w-5 mb-2 text-primary" />
                          <div className="font-medium text-sm">{r.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={onContinue} className="w-full" disabled={!chosen}>
                    Continue
                  </Button>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
