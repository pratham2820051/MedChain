import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/mock-store";
import { useWallet } from "@/hooks/useWallet";
import { useEffect } from "react";

export const Route = createFileRoute("/patient")({
  component: PatientLayout,
});

function PatientLayout() {
  const storeWallet = useStore((s) => s.wallet);
  const role = useStore((s) => s.role);
  const { walletAddress } = useWallet();
  const navigate = useNavigate();

  // Accept wallet from either WalletContext (real MetaMask) or mock-store
  const wallet = walletAddress ?? storeWallet;

  useEffect(() => {
    if (!wallet || role !== "patient") {
      navigate({ to: "/connect", replace: true });
    }
  }, [wallet, role, navigate]);

  if (!wallet || role !== "patient") return null;

  return (
    <AppShell role="patient">
      <Outlet />
    </AppShell>
  );
}
