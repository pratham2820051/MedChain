import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { shortAddr, disconnectWallet } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Wallet, AlertTriangle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

export function AppShell({ role, children }: { role: "patient" | "doctor"; children: ReactNode }) {
  const { walletAddress, isConnected, isCorrectNetwork, switchToSepolia } = useWallet();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnectWallet();
    navigate({ to: "/" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-soft">
        <AppSidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/60 bg-card/60 backdrop-blur px-3 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium capitalize text-muted-foreground hidden sm:inline">
                {role} Portal
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Wrong network banner */}
              {isConnected && !isCorrectNetwork && (
                <button
                  onClick={async () => {
                    try {
                      await switchToSepolia();
                      toast.success("Switched to Sepolia");
                    } catch {
                      toast.error("Failed to switch network");
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/25 transition"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Wrong Network — Switch to Sepolia
                </button>
              )}

              {/* Wallet address pill */}
              {isConnected ? (
                <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium">
                  <span
                    className={`h-2 w-2 rounded-full ${isCorrectNetwork ? "bg-accent" : "bg-yellow-500"}`}
                  />
                  <Wallet className="h-3.5 w-3.5" />
                  {shortAddr(walletAddress)}
                </div>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link to="/connect">Connect Wallet</Link>
                </Button>
              )}

              <Button size="icon" variant="ghost" onClick={handleDisconnect} title="Disconnect">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
