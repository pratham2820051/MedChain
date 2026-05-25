/**
 * encryptionService.ts — Key management + encrypt/decrypt orchestration.
 *
 * MVP approach (Phase 5 — college project):
 *   AES keys are stored in localStorage keyed by record ID.
 *   Future production: encrypt AES key with patient's public key.
 *
 * Storage format in localStorage:
 *   medchain_keys_v1 → { [recordId]: aesKeyHex }
 */

import { generateAESKey, encryptFile, encryptedStringToBlob } from "@/utils/encrypt";
import { decryptToBlob, getMimeType } from "@/utils/decrypt";

// ── Key Storage ───────────────────────────────────────────────────────────────

const KEY_STORE = "medchain_keys_v1";

function loadKeyStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY_STORE);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveKeyStore(store: Record<string, string>) {
  localStorage.setItem(KEY_STORE, JSON.stringify(store));
}

/**
 * Saves an AES key for a record ID.
 */
export function saveKey(recordId: string, aesKey: string): void {
  const store = loadKeyStore();
  store[recordId] = aesKey;
  saveKeyStore(store);
}

/**
 * Retrieves the AES key for a record ID.
 * Returns null if not found (e.g. different device or cleared storage).
 */
export function getKey(recordId: string): string | null {
  return loadKeyStore()[recordId] ?? null;
}

/**
 * Returns true if a key exists for this record.
 */
export function hasKey(recordId: string): boolean {
  return !!getKey(recordId);
}

/**
 * Removes a key (e.g. after revoking access).
 */
export function removeKey(recordId: string): void {
  const store = loadKeyStore();
  delete store[recordId];
  saveKeyStore(store);
}

// ── Encrypt + Prepare for IPFS ────────────────────────────────────────────────

export interface EncryptResult {
  encryptedFile: File; // ready to upload to IPFS
  aesKey: string; // hex key — save this with saveKey()
}

/**
 * Encrypts a medical file with a fresh AES-256 key.
 * Returns the encrypted File and the key.
 *
 * @param file      Original medical file
 * @param recordId  Unique ID to associate the key with
 */
export async function encryptMedicalFile(file: File, recordId: string): Promise<EncryptResult> {
  // Generate a fresh random key for this file
  const aesKey = generateAESKey();

  // Encrypt the file
  const encryptedData = await encryptFile(file, aesKey);

  // Wrap as a File for IPFS upload
  const encryptedFile = encryptedStringToBlob(encryptedData, file.name);

  // Persist key in localStorage
  saveKey(recordId, aesKey);

  return { encryptedFile, aesKey };
}

// ── Decrypt from IPFS ─────────────────────────────────────────────────────────

export interface DecryptResult {
  blob: Blob; // decrypted file as Blob
  objectUrl: string; // temporary URL for preview/download
  mimeType: string;
}

/**
 * Downloads an encrypted file from IPFS and decrypts it.
 *
 * @param cid           IPFS CID
 * @param recordId      Used to look up the AES key from localStorage
 * @param originalName  Original file name (used to detect MIME type)
 * @param gatewayUrl    Full IPFS gateway URL
 */
export async function decryptFromIPFS(
  cid: string,
  recordId: string,
  originalName: string,
  gatewayUrl: string,
): Promise<DecryptResult> {
  // Get the key
  const aesKey = getKey(recordId);
  if (!aesKey) {
    throw new Error("Unable to decrypt record — encryption key not found on this device.");
  }

  // Download encrypted file from IPFS
  const response = await fetch(gatewayUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch encrypted file from IPFS (HTTP ${response.status}).`);
  }

  const encryptedData = await response.text();

  // Detect MIME type from original file name
  const mimeType = getMimeType(originalName);

  // Decrypt
  const blob = decryptToBlob(encryptedData, aesKey, mimeType);
  const objectUrl = URL.createObjectURL(blob);

  return { blob, objectUrl, mimeType };
}

/**
 * Decrypts using a manually provided AES key (for doctor access sharing).
 */
export async function decryptWithKey(
  gatewayUrl: string,
  aesKey: string,
  originalName: string,
): Promise<DecryptResult> {
  const response = await fetch(gatewayUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch encrypted file from IPFS (HTTP ${response.status}).`);
  }

  const encryptedData = await response.text();
  const mimeType = getMimeType(originalName);
  const blob = decryptToBlob(encryptedData, aesKey, mimeType);
  const objectUrl = URL.createObjectURL(blob);

  return { blob, objectUrl, mimeType };
}
