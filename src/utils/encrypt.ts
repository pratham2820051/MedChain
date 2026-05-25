/**
 * encrypt.ts — AES-256 file encryption utilities for MedChain Phase 5.
 *
 * Uses crypto-js AES with a randomly generated 256-bit key per file.
 * The encrypted output is a Base64 string safe for IPFS upload.
 */

import CryptoJS from "crypto-js";

// ── Key Generation ────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random AES-256 key.
 * Returns a 64-character hex string (256 bits).
 */
export function generateAESKey(): string {
  const wordArray = CryptoJS.lib.WordArray.random(32); // 32 bytes = 256 bits
  return wordArray.toString(CryptoJS.enc.Hex);
}

// ── Encryption ────────────────────────────────────────────────────────────────

/**
 * Encrypts a File using AES-256-CBC.
 *
 * @param file    The original medical file (PDF, PNG, etc.)
 * @param aesKey  Hex string key from generateAESKey()
 * @returns       Encrypted content as a Base64 string
 */
export async function encryptFile(file: File, aesKey: string): Promise<string> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Convert to CryptoJS WordArray
  const wordArray = CryptoJS.lib.WordArray.create(uint8Array as unknown as number[]);

  // Parse key from hex
  const key = CryptoJS.enc.Hex.parse(aesKey);

  // Generate random IV (16 bytes)
  const iv = CryptoJS.lib.WordArray.random(16);

  // Encrypt
  const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Prepend IV to ciphertext so we can recover it during decryption
  // Format: <iv_hex(32 chars)><ciphertext_base64>
  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const cipherBase64 = encrypted.toString(); // already Base64

  return ivHex + ":" + cipherBase64;
}

/**
 * Converts an encrypted string to a Blob for IPFS upload.
 */
export function encryptedStringToBlob(encryptedData: string, originalFileName: string): File {
  const blob = new Blob([encryptedData], { type: "application/octet-stream" });
  return new File([blob], `${originalFileName}.enc`, { type: "application/octet-stream" });
}
