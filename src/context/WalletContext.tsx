/**
 * WalletContext — global MetaMask + Sepolia state.
 *
 * Provides:
 *   walletAddress  – connected address or null
 *   chainId        – current chain id (number) or null
 *   isConnected    – true when address is set
 *   isCorrectNetwork – true when on Sepolia (11155111)
 *   balance        – ETH balance string or null
 *   connect()      – request MetaMask accounts
 *   disconnect()   – clear local state
 */

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { formatEther } from "ethers";
import { getProvider, SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_HEX } from "@/contracts/contract";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WalletState {
  walletAddress: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  balance: string | null;
  connect: () => Promise<string>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletState | null>(null);

export { WalletContext };

// ── Provider ──────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const isConnected = !!walletAddress;
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  // ── Fetch balance ──────────────────────────────────────────────────────────
  const fetchBalance = useCallback(async (address: string) => {
    try {
      const provider = getProvider();
      const raw = await provider.getBalance(address);
      setBalance(parseFloat(formatEther(raw)).toFixed(4));
    } catch {
      setBalance(null);
    }
  }, []);

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(async (): Promise<string> => {
    if (!window.ethereum) throw new Error("MetaMask not installed");

    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    const address = accounts[0];
    setWalletAddress(address);

    const rawChain = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    const id = parseInt(rawChain, 16);
    setChainId(id);

    await fetchBalance(address);
    return address;
  }, [fetchBalance]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setWalletAddress(null);
    setChainId(null);
    setBalance(null);
  }, []);

  // ── Switch to Sepolia ──────────────────────────────────────────────────────
  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      });
    } catch (err: unknown) {
      // Chain not added yet — add it
      if ((err as { code?: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_HEX,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } else {
        throw err;
      }
    }
  }, []);

  // ── Listen for MetaMask events ─────────────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = (args: unknown) => {
      const accounts = args as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWalletAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    const onChainChanged = (args: unknown) => {
      setChainId(parseInt(args as string, 16));
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);

    // Restore session if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (result) => {
        const accounts = result as string[];
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const rawChain = (await window.ethereum!.request({ method: "eth_chainId" })) as string;
          setChainId(parseInt(rawChain, 16));
          fetchBalance(accounts[0]);
        }
      })
      .catch(() => {});

    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener("chainChanged", onChainChanged);
    };
  }, [disconnect, fetchBalance]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        chainId,
        isConnected,
        isCorrectNetwork,
        balance,
        connect,
        disconnect,
        switchToSepolia,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
