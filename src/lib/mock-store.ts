// Mock store with placeholder functions for backend / blockchain / encryption.
// No real network or chain calls — purely client-side mock data.

export type RecordType = "Lab Report" | "Prescription" | "Scan" | "X-Ray" | "MRI" | "Other";
export type UserRole = "patient" | "doctor";

export interface MedRecord {
  id: string;
  name: string;
  type: RecordType;
  uploadDate: string;
  description?: string;
  status: "Active" | "Archived";
  ownerAddress: string;
  fileName?: string;
  ipfsCid?: string;        // real IPFS CID from Phase 4
  ipfsGatewayUrl?: string; // full gateway URL
  isEncrypted?: boolean;   // Phase 5 — true if file was AES encrypted
}

export interface AccessGrant {
  id: string;
  doctorAddress: string;
  patientAddress: string;
  expiryDate: string;
  status: "Active" | "Revoked" | "Expired";
}

export interface AuditEvent {
  id: string;
  eventType: "Upload" | "Grant" | "Revoke" | "View" | "Download" | "Request";
  walletAddress: string;
  timestamp: string;
  txId: string;
  status: "Success" | "Pending" | "Failed";
}

export interface AccessRequest {
  id: string;
  patientAddress: string;
  doctorAddress: string;
  requestDate: string;
  status: "Pending" | "Approved" | "Denied";
}

export interface Notification {
  id: string;
  type: "Access Approved" | "Access Revoked" | "New Records Available";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Profile {
  address: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
}

interface StoreState {
  wallet: string | null;
  role: UserRole | null;
  records: MedRecord[];
  grants: AccessGrant[];
  audit: AuditEvent[];
  requests: AccessRequest[];
  notifications: Notification[];
  profile: Profile;
}

const KEY = "medchain_state_v1";

const randomAddr = () =>
  "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

const txId = () => "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10);

const seed = (): StoreState => {
  const patient = "0xA1b2C3d4E5f6789012345678901234567890aBcD";
  const doctor = "0xDoC7E89012345678901234567890123456abcdEF";
  return {
    wallet: null,
    role: null,
    records: [
      { id: "r1", name: "Annual Blood Panel", type: "Lab Report", uploadDate: "2025-04-12", status: "Active", ownerAddress: patient, description: "Routine annual lab work." },
      { id: "r2", name: "Chest X-Ray", type: "X-Ray", uploadDate: "2025-03-02", status: "Active", ownerAddress: patient, description: "Follow-up imaging." },
      { id: "r3", name: "Amoxicillin Prescription", type: "Prescription", uploadDate: "2025-02-18", status: "Active", ownerAddress: patient },
      { id: "r4", name: "Brain MRI", type: "MRI", uploadDate: "2024-12-01", status: "Active", ownerAddress: patient },
    ],
    grants: [
      { id: "g1", doctorAddress: doctor, patientAddress: patient, expiryDate: "2026-01-01", status: "Active" },
    ],
    audit: [
      { id: "a1", eventType: "Upload", walletAddress: patient, timestamp: "2025-04-12T10:23:00Z", txId: txId(), status: "Success" },
      { id: "a2", eventType: "Grant", walletAddress: patient, timestamp: "2025-04-13T08:11:00Z", txId: txId(), status: "Success" },
      { id: "a3", eventType: "View", walletAddress: doctor, timestamp: "2025-04-14T14:02:00Z", txId: txId(), status: "Success" },
      { id: "a4", eventType: "Download", walletAddress: doctor, timestamp: "2025-04-15T09:30:00Z", txId: txId(), status: "Success" },
    ],
    requests: [
      { id: "q1", patientAddress: patient, doctorAddress: doctor, requestDate: "2025-04-10", status: "Approved" },
    ],
    notifications: [
      { id: "n1", type: "Access Approved", message: "Patient 0xA1b2…aBcD approved access.", timestamp: "2025-04-13T08:11:00Z", read: false },
      { id: "n2", type: "New Records Available", message: "New lab report shared.", timestamp: "2025-04-12T10:23:00Z", read: false },
    ],
    profile: { address: patient, role: "patient", name: "Alex Morgan", email: "alex@example.com", phone: "+1 555 0100" },
  };
};

function load(): StoreState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as StoreState;
  } catch {
    return seed();
  }
}

function save(s: StoreState) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}

type Listener = () => void;
const listeners = new Set<Listener>();
let state: StoreState | null = null;

function getState(): StoreState {
  if (!state) state = load();
  return state;
}

export function setState(updater: (s: StoreState) => StoreState) {
  state = updater(getState());
  save(state);
  listeners.forEach((l) => l());
}

import { useSyncExternalStore } from "react";

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(getState()),
    () => selector(getState()),
  );
}

// ---- Placeholder API functions ----

export async function connectWallet(): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  const addr = getState().wallet ?? randomAddr();
  setState((s) => ({ ...s, wallet: addr }));
  return addr;
}

export function disconnectWallet() {
  setState((s) => ({ ...s, wallet: null, role: null }));
}

export function setRole(role: UserRole) {
  setState((s) => ({
    ...s,
    role,
    profile: {
      ...s.profile,
      role,
      address: s.wallet ?? s.profile.address,
      ...(role === "doctor"
        ? { name: s.profile.name ?? "Dr. Sam Patel", specialization: "Internal Medicine", hospital: "Northview General" }
        : {}),
    },
  }));
}

export async function uploadRecord(input: { name: string; type: RecordType; fileName: string; description?: string; ipfsCid?: string; ipfsGatewayUrl?: string; isEncrypted?: boolean }) {
  await new Promise((r) => setTimeout(r, 800));
  const id = "r" + Math.random().toString(36).slice(2, 8);
  setState((s) => ({
    ...s,
    records: [
      { id, name: input.name, type: input.type, fileName: input.fileName, description: input.description, uploadDate: new Date().toISOString().slice(0, 10), status: "Active", ownerAddress: s.wallet ?? s.profile.address, ipfsCid: input.ipfsCid, ipfsGatewayUrl: input.ipfsGatewayUrl, isEncrypted: input.isEncrypted },
      ...s.records,
    ],
    audit: [
      { id: "a" + Math.random().toString(36).slice(2, 8), eventType: "Upload", walletAddress: s.wallet ?? s.profile.address, timestamp: new Date().toISOString(), txId: txId(), status: "Success" },
      ...s.audit,
    ],
  }));
  return id;
}

export function deleteRecord(id: string) {
  setState((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }));
}

export async function grantAccess(doctorAddress: string, expiryDate: string) {
  await new Promise((r) => setTimeout(r, 500));
  setState((s) => ({
    ...s,
    grants: [
      { id: "g" + Math.random().toString(36).slice(2, 8), doctorAddress, patientAddress: s.wallet ?? s.profile.address, expiryDate, status: "Active" },
      ...s.grants,
    ],
    audit: [
      { id: "a" + Math.random().toString(36).slice(2, 8), eventType: "Grant", walletAddress: s.wallet ?? s.profile.address, timestamp: new Date().toISOString(), txId: txId(), status: "Success" },
      ...s.audit,
    ],
  }));
}

export async function revokeAccess(grantId: string) {
  await new Promise((r) => setTimeout(r, 400));
  setState((s) => ({
    ...s,
    grants: s.grants.map((g) => (g.id === grantId ? { ...g, status: "Revoked" } : g)),
    audit: [
      { id: "a" + Math.random().toString(36).slice(2, 8), eventType: "Revoke", walletAddress: s.wallet ?? s.profile.address, timestamp: new Date().toISOString(), txId: txId(), status: "Success" },
      ...s.audit,
    ],
  }));
}

export async function requestAccess(patientAddress: string) {
  await new Promise((r) => setTimeout(r, 500));
  setState((s) => ({
    ...s,
    requests: [
      { id: "q" + Math.random().toString(36).slice(2, 8), patientAddress, doctorAddress: s.wallet ?? s.profile.address, requestDate: new Date().toISOString().slice(0, 10), status: "Pending" },
      ...s.requests,
    ],
    audit: [
      { id: "a" + Math.random().toString(36).slice(2, 8), eventType: "Request", walletAddress: s.wallet ?? s.profile.address, timestamp: new Date().toISOString(), txId: txId(), status: "Pending" },
      ...s.audit,
    ],
  }));
}

export function getRecords() {
  return getState().records;
}
export function getAuditLogs() {
  return getState().audit;
}
export function downloadRecord(id: string) {
  const rec = getState().records.find((r) => r.id === id);
  setState((s) => ({
    ...s,
    audit: [
      { id: "a" + Math.random().toString(36).slice(2, 8), eventType: "Download", walletAddress: s.wallet ?? s.profile.address, timestamp: new Date().toISOString(), txId: txId(), status: "Success" },
      ...s.audit,
    ],
  }));
  return rec;
}

export function updateProfile(patch: Partial<Profile>) {
  setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
}

export function markAllRead() {
  setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
}

export function shortAddr(a?: string | null) {
  if (!a) return "—";
  return a.slice(0, 6) + "…" + a.slice(-4);
}
