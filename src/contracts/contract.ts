import { BrowserProvider, Contract, Signer } from "ethers";
import ABI from "./abi.json";

// ── Deployed on Ethereum Sepolia Testnet ──────────────────────────────────────
export const CONTRACT_ADDRESS = "0xbe85FFcB7a268ac9c1059Bd42229fDf4f0043082";

// Sepolia chain id (decimal)
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_HEX = "0xaa36a7";

export const CONTRACT_ABI = ABI;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a read-only provider connected to the user's injected wallet. */
export function getProvider(): BrowserProvider {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  return new BrowserProvider(window.ethereum);
}

/** Returns a signer (requires wallet approval). */
export async function getSigner(): Promise<Signer> {
  const provider = getProvider();
  return provider.getSigner();
}

/** Returns a contract instance backed by a signer (write operations). */
export async function getMedChainContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/** Returns a read-only contract instance (view calls, no MetaMask popup). */
export async function getMedChainContractReadOnly(): Promise<Contract> {
  const provider = getProvider();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}
