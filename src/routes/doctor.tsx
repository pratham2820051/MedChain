import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/mock-store";
import { useWallet } from "@/hooks/useWallet";
import { useEffect } from "react";

export const Route = createFileRoute("/doctor")({
  component: DoctorLayout,
});

function DoctorLayout() {
  const storeWallet = useStore((s) => s.wallet);
  const role = useStore((s) => s.role);
  const { walletAddress } = useWallet();
  const navigate = useNavigate();

  // Accept wallet from either WalletContext (real MetaMask) or mock-store
  const wallet = walletAddress ?? storeWallet;

  useEffect(() => {
    if (!wallet || role !== "doctor") {
      navigate({ to: "/connect", replace: true });
    }
  }, [wallet, role, navigate]);

  if (!wallet || role !== "doctor") return null;

  return (
    <AppShell role="doctor">
      <Outlet />
    </AppShell>
  );
}
