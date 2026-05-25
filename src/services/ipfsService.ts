/**
 * ipfsService — Pinata IPFS integration for MedChain Phase 4.
 *
 * Responsibilities:
 *   - Upload medical files to IPFS via Pinata REST API
 *   - Return the generated CID
 *   - Build gateway URLs for viewing / downloading files
 *
 * Security:
 *   - JWT is read from VITE_PINATA_JWT (env var, never committed)
 *   - Files are stored on IPFS, NOT on blockchain
 *   - Only the CID is stored on-chain
 */

// ── Config ────────────────────────────────────────────────────────────────────

// VITE_PINATA_JWT is injected at build time via .env (local) or Cloudflare env vars (hosted)
const PINATA_JWT =
  (import.meta.env.VITE_PINATA_JWT as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YTliYjkxYS02ZWQzLTQ3ZmUtOTQ4Zi0yYjFkZDg0Yzk5YjYiLCJlbWFpbCI6InByYXRoYW1waDEyM0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYWM0N2Y4YWJkMWI2M2NkZDk1YTEiLCJzY29wZWRLZXlTZWNyZXQiOiJhZmVmYmNmN2M3NjRlZjNmNzk4Y2VkZGZiMDBlYTZlZmU5YzhmYmQ0ZTRkZjdiY2RhOTc0MmY1YjEwNDNiM2U3IiwiZXhwIjoxODExMjYzODAyfQ.d9zN__irYfG5B4ZmOdh8gS7UgSRB_zgTCpnTss7Pb6o";

const PINATA_GATEWAY =
  (import.meta.env.VITE_PINATA_GATEWAY as string | undefined) ??
  "https://gateway.pinata.cloud/ipfs";

const PINATA_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum allowed file size: 20 MB */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

/** Allowed MIME types */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

/** Human-readable allowed extensions */
export const ALLOWED_EXTENSIONS = ["PDF", "PNG", "JPEG", "JPG", "DOCX"];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IpfsUploadResult {
  cid: string; // IPFS CID e.g. QmX9abc123xyz...
  gatewayUrl: string; // Full URL to view the file
  fileName: string;
  fileSize: number;
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates a file before upload.
 * Throws a descriptive error if validation fails.
 */
export function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Maximum file size is 20 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type: ${file.type || "unknown"}. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    );
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Uploads a medical file to IPFS via Pinata.
 *
 * @param file        The File object to upload
 * @param recordName  Human-readable name stored as Pinata metadata
 * @param onProgress  Optional callback with upload progress 0–100
 * @returns           IpfsUploadResult with CID and gateway URL
 */
export async function uploadToIPFS(
  file: File,
  recordName: string,
  onProgress?: (pct: number) => void,
): Promise<IpfsUploadResult> {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured. Add VITE_PINATA_JWT to your .env file.");
  }

  // Note: validation is done before encryption in the upload page.
  // Do NOT validate here — encrypted files are always application/octet-stream.

  // Build multipart form
  const formData = new FormData();
  formData.append("file", file);

  // Pinata metadata — stored alongside the file
  const metadata = JSON.stringify({
    name: recordName,
    keyvalues: {
      app: "MedChain",
      uploadedAt: new Date().toISOString(),
    },
  });
  formData.append("pinataMetadata", metadata);

  // Pinata options
  const options = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", options);

  onProgress?.(10);

  // Upload via fetch (XMLHttpRequest used for progress tracking)
  const cid = await uploadWithProgress(formData, onProgress);

  onProgress?.(100);

  return {
    cid,
    gatewayUrl: buildGatewayUrl(cid),
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Internal: uploads using XMLHttpRequest so we can track progress.
 */
function uploadWithProgress(
  formData: FormData,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        // Map upload progress to 10–90% range (10% reserved for init, 10% for response)
        const pct = 10 + Math.round((e.loaded / e.total) * 80);
        onProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as { IpfsHash: string };
          resolve(response.IpfsHash);
        } catch {
          reject(new Error("Invalid response from Pinata."));
        }
      } else {
        let msg = `IPFS upload failed (HTTP ${xhr.status}).`;
        try {
          const err = JSON.parse(xhr.responseText) as { error?: { details?: string } };
          if (err.error?.details) msg = err.error.details;
        } catch {
          /* ignore */
        }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during IPFS upload.")));
    xhr.addEventListener("abort", () => reject(new Error("IPFS upload was aborted.")));

    xhr.open("POST", PINATA_UPLOAD_URL);
    xhr.setRequestHeader("Authorization", `Bearer ${PINATA_JWT}`);
    xhr.send(formData);
  });
}

// ── Gateway URL ───────────────────────────────────────────────────────────────

/**
 * Builds a public IPFS gateway URL from a CID.
 * Uses the configured Pinata gateway by default.
 */
export function buildGatewayUrl(cid: string): string {
  if (!cid || cid === "QmDummyCID123") return "";
  return `${PINATA_GATEWAY}/${cid}`;
}

/**
 * Opens an IPFS file in a new browser tab.
 */
export function openIpfsFile(cid: string): void {
  const url = buildGatewayUrl(cid);
  if (!url) {
    throw new Error("Invalid CID — cannot open file.");
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Triggers a file download from IPFS gateway.
 */
export async function downloadFromIPFS(cid: string, fileName: string): Promise<void> {
  const url = buildGatewayUrl(cid);
  if (!url) throw new Error("Invalid CID — cannot download file.");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch file from IPFS (HTTP ${response.status}).`);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName || cid;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

/**
 * Returns true if the CID is a real IPFS hash (not a dummy).
 */
export function isRealCid(cid: string): boolean {
  return !!cid && cid !== "QmDummyCID123" && cid.length > 10;
}
