/**
 * decrypt.ts — AES-256 file decryption utilities for MedChain Phase 5.
 *
 * Reverses the encryption done in encrypt.ts.
 * Produces the original file bytes for preview or download.
 */

import CryptoJS from "crypto-js";

// ── Decryption ────────────────────────────────────────────────────────────────

/**
 * Decrypts an AES-256-CBC encrypted string back to the original file bytes.
 *
 * @param encryptedData  The "<iv_hex>:<ciphertext_base64>" string from IPFS
 * @param aesKey         Hex string key stored in localStorage
 * @returns              Uint8Array of the original file bytes
 */
export function decryptFile(encryptedData: string, aesKey: string): Uint8Array {
  const parts = encryptedData.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format.");
  }

  const [ivHex, cipherBase64] = parts;

  // Parse key and IV
  const key = CryptoJS.enc.Hex.parse(aesKey);
  const iv = CryptoJS.enc.Hex.parse(ivHex);

  // Decrypt
  const decrypted = CryptoJS.AES.decrypt(cipherBase64, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  if (!decrypted || decrypted.sigBytes <= 0) {
    throw new Error("Decryption failed. Invalid key or corrupted data.");
  }

  // Convert WordArray back to Uint8Array
  const words = decrypted.words;
  const sigBytes = decrypted.sigBytes;
  const uint8 = new Uint8Array(sigBytes);

  for (let i = 0; i < sigBytes; i++) {
    uint8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return uint8;
}

/**
 * Decrypts and returns a Blob ready for preview or download.
 *
 * @param encryptedData  Encrypted string from IPFS
 * @param aesKey         Hex AES key
 * @param mimeType       Original file MIME type (e.g. "application/pdf")
 */
export function decryptToBlob(
  encryptedData: string,
  aesKey: string,
  mimeType = "application/octet-stream"
): Blob {
  const bytes = decryptFile(encryptedData, aesKey);
  return new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
}

/**
 * Detects MIME type from the original file name extension.
 */
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
