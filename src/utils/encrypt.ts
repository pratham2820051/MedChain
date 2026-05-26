/**
 * encrypt.ts — AES-256 file encryption utilities for MedChain Phase 5.
 */

import CryptoJS from "crypto-js";

// ── Key Generation ────────────────────────────────────────────────────────────

export function generateAESKey(): string {
  const wordArray = CryptoJS.lib.WordArray.random(32);
  return wordArray.toString(CryptoJS.enc.Hex);
}

// ── Encryption ────────────────────────────────────────────────────────────────

export async function encryptFile(file: File, aesKey: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Convert Uint8Array to Base64 first, then to WordArray — most reliable method
  const base64 = uint8ArrayToBase64(uint8Array);
  const wordArray = CryptoJS.enc.Base64.parse(base64);

  const key = CryptoJS.enc.Hex.parse(aesKey);
  const iv = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const cipherBase64 = encrypted.toString();

  return ivHex + ":" + cipherBase64;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function encryptedStringToBlob(encryptedData: string, originalFileName: string): File {
  const blob = new Blob([encryptedData], { type: "application/octet-stream" });
  return new File([blob], `${originalFileName}.enc`, { type: "application/octet-stream" });
}
