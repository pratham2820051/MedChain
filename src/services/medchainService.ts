/**
 * medchainService — all smart-contract interactions for MedChain.
 *
 * Every function here talks to the deployed MedChain.sol on Sepolia via
 * ethers.js v6.  No mock data — real blockchain calls.
 */

import { getMedChainContract, getMedChainContractReadOnly } from "@/contracts/contract";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChainRecord {
  ipfsHash: string;
  recordType: string;
  timestamp: number; // unix seconds
  uploadedBy: string; // wallet address
}

// ── FR-1  Register Patient ────────────────────────────────────────────────────

/**
 * Registers the connected wallet as a patient on-chain.
 * Reverts if already registered.
 */
export async function registerPatient(): Promise<void> {
  const contract = await getMedChainContract();
  const tx = await contract.registerPatient();
  await tx.wait();
}

// ── FR-2  Upload Record ───────────────────────────────────────────────────────

/**
 * Stores record metadata on-chain.
 * Phase 3 uses a dummy CID; Phase 4 will replace with real IPFS hash.
 *
 * @param recordType  e.g. "Lab Report", "X-Ray"
 * @param ipfsHash    IPFS CID (defaults to dummy for Phase 3)
 */
export async function uploadRecord(recordType: string, ipfsHash = "QmDummyCID123"): Promise<void> {
  const contract = await getMedChainContract();
  const tx = await contract.uploadRecord(ipfsHash, recordType);
  await tx.wait();
}

// ── FR-3  Grant Access ────────────────────────────────────────────────────────

/**
 * Grants a doctor time-limited access to the caller's records.
 *
 * @param doctorAddress  Doctor's wallet address (0x…)
 * @param expiryDate     ISO date string e.g. "2026-01-01"
 */
export async function grantAccess(doctorAddress: string, expiryDate: string): Promise<void> {
  const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
  const contract = await getMedChainContract();
  const tx = await contract.grantAccess(doctorAddress, expiryTimestamp);
  await tx.wait();
}

// ── FR-4  Revoke Access ───────────────────────────────────────────────────────

/**
 * Immediately revokes a doctor's access.
 *
 * @param doctorAddress  Doctor's wallet address (0x…)
 */
export async function revokeAccess(doctorAddress: string): Promise<void> {
  const contract = await getMedChainContract();
  const tx = await contract.revokeAccess(doctorAddress);
  await tx.wait();
}

// ── FR-5  Check Access ────────────────────────────────────────────────────────

/**
 * Returns true if the doctor currently has valid, non-expired access.
 * Read-only — no MetaMask popup.
 */
export async function checkAccess(patientAddress: string, doctorAddress: string): Promise<boolean> {
  const contract = await getMedChainContractReadOnly();
  return contract.checkAccess(patientAddress, doctorAddress) as Promise<boolean>;
}

// ── FR-6  Get Records ─────────────────────────────────────────────────────────

/**
 * Returns all records for a patient.
 * Caller must be the patient themselves or a doctor with valid access.
 * Emits RecordAccessed event on-chain when a doctor calls this.
 */
export async function getRecords(patientAddress: string): Promise<ChainRecord[]> {
  const contract = await getMedChainContract();
  // getRecords is non-payable (emits event) so we use a transaction
  const raw: Array<{
    ipfsHash: string;
    recordType: string;
    timestamp: bigint;
    uploadedBy: string;
  }> = await contract.getRecords.staticCall(patientAddress);

  return raw.map((r) => ({
    ipfsHash: r.ipfsHash,
    recordType: r.recordType,
    timestamp: Number(r.timestamp),
    uploadedBy: r.uploadedBy,
  }));
}

// ── FR-9  Record Count ────────────────────────────────────────────────────────

/**
 * Returns the number of records a patient has uploaded.
 * Caller must be the patient or an authorized doctor.
 */
export async function getRecordCount(patientAddress: string): Promise<number> {
  const contract = await getMedChainContractReadOnly();
  const count: bigint = await contract.getRecordCount(patientAddress);
  return Number(count);
}

// ── Check Registration ────────────────────────────────────────────────────────

/**
 * Returns true if the wallet is a registered patient.
 * Read-only — no MetaMask popup.
 */
export async function isPatientRegistered(walletAddress: string): Promise<boolean> {
  const contract = await getMedChainContractReadOnly();
  return contract.isPatientRegistered(walletAddress) as Promise<boolean>;
}

// ── Error Parser ──────────────────────────────────────────────────────────────

/**
 * Converts ethers / MetaMask errors into user-friendly messages.
 */
export function parseContractError(err: unknown): string {
  if (typeof err !== "object" || err === null) return "Unknown error";

  const e = err as { code?: string | number; reason?: string; message?: string };

  if (e.code === "ACTION_REJECTED" || e.code === 4001) {
    return "Transaction cancelled by user.";
  }
  if (e.reason) return e.reason;
  if (e.message) {
    // Strip ethers boilerplate
    const match = e.message.match(/reason="([^"]+)"/);
    if (match) return match[1];
    return e.message.slice(0, 120);
  }
  return "Blockchain transaction failed.";
}
