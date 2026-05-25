/**
 * useWallet — reads from WalletContext.
 * Kept in its own file so React Fast Refresh treats it as a pure hook module.
 */
import { useContext } from "react";
import { WalletContext } from "@/context/WalletContext";

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
