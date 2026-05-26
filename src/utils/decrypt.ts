/**
 * decrypt.ts — AES-256 file decryption utilities for MedChain Phase 5.
 */

import CryptoJS from "crypto-js";

// ── Decryption ────────────────────────────────────────────────────────────────

export function decryptFile(encryptedData: string, aesKey: string): Uint8Array {
  const parts = encryptedData.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format.");
  }

  const [ivHex, cipherBase64] = parts;

  const key = CryptoJS.enc.Hex.parse(aesKey);
  const iv = CryptoJS.enc.Hex.parse(ivHex);

  const decrypted = CryptoJS.AES.decrypt(cipherBase64, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  if (!decrypted || decrypted.sigBytes <= 0) {
    throw new Error("Decryption failed. Invalid key or corrupted data.");
  }

  // Convert decrypted WordArray back to Base64, then to Uint8Array
  // This is the most reliable round-trip method
  const base64 = CryptoJS.enc.Base64.stringify(decrypted);
  return base64ToUint8Array(base64);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function decryptToBlob(
  encryptedData: string,
  aesKey: string,
  mimeType = "application/octet-stream",
): Blob {
  const bytes = decryptFile(encryptedData, aesKey);
  // Create blob directly from the Uint8Array (not .buffer which may have padding)
  return new Blob([bytes.slice()], { type: mimeType });
}

export function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}
