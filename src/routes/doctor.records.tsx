import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { shortAddr } from "@/lib/mock-store";
import {
  getRecords,
  checkAccess,
  parseContractError,
  type ChainRecord,
} from "@/services/medchainService";
import { buildGatewayUrl, isRealCid } from "@/services/ipfsService";
import { decryptWithKey } from "@/services/encryptionService";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, ShieldCheck, ShieldOff, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/doctor/records")({
  head: () => ({ meta: [{ title: "Patient Records — MedChain" }] }),
  component: PatientRecords,
});

interface RecordWithDecrypt extends ChainRecord {
  previewUrl?: string;
  previewMime?: string;
}

function PatientRecords() {
  const { isConnected, isCorrectNetwork, walletAddress } = useWallet();
  const [patientAddr, setPatientAddr] = useState("");
  const [records, setRecords] = useState<RecordWithDecrypt[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Decrypt dialog state
  const [decryptOpen, setDecryptOpen] = useState(false);
  const [decryptIndex, setDecryptIndex] = useState<number | null>(null);
  const [aesKeyInput, setAesKeyInput] = useState("");
  const [fileExtInput, setFileExtInput] = useState("pdf");
  const [decrypting, setDecrypting] = useState(false);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientAddr) {
      toast.error("Enter a patient address.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(patientAddr)) {
      toast.error("Invalid patient wallet address.");
      return;
    }
    if (!isConnected || !isCorrectNetwork) {
      toast.error("Connect MetaMask on Sepolia first.");
      return;
    }

    setLoading(true);
    setSearched(false);
    setRecords([]);
    try {
      const access = await checkAccess(patientAddr, walletAddress!);
      setHasAccess(access);
      if (!access) {
        toast.error("Access denied or expired for this patient.");
        setSearched(true);
        return;
      }
      const data = await getRecords(patientAddr);
      setRecords(data);
      setSearched(true);
      toast.success(`${data.length} record(s) retrieved from blockchain`);
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const openDecryptDialog = (index: number) => {
    setDecryptIndex(index);
    setAesKeyInput("");
    setFileExtInput("pdf");
    setDecryptOpen(true);
  };

  const handleDecrypt = async () => {
    if (decryptIndex === null) return;
    const record = records[decryptIndex];
    if (!aesKeyInput.trim()) {
      toast.error("Enter the AES decryption key.");
      return;
    }
    if (!isRealCid(record.ipfsHash)) {
      toast.error("No real IPFS file for this record.");
      return;
    }

    setDecrypting(true);
    try {
      const gatewayUrl = buildGatewayUrl(record.ipfsHash);
      // Use user-provided extension for correct MIME detection
      const fileName = `record-${decryptIndex + 1}.${fileExtInput || "pdf"}`;
      const { objectUrl, mimeType } = await decryptWithKey(
        gatewayUrl,
        aesKeyInput.trim(),
        fileName,
      );

      setRecords((prev) =>
        prev.map((r, i) =>
          i === decryptIndex ? { ...r, previewUrl: objectUrl, previewMime: mimeType } : r,
        ),
      );
      setDecryptOpen(false);
      toast.success("File decrypted successfully");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDecrypting(false);
    }
  };

  const handleDownload = (index: number) => {
    const record = records[index];
    if (!record.previewUrl) {
      toast.error("Decrypt the file first.");
      return;
    }
    const a = document.createElement("a");
    a.href = record.previewUrl;
    // Use record type to guess extension
    const ext = record.previewMime === "application/pdf" ? ".pdf"
      : record.previewMime === "image/png" ? ".png"
      : record.previewMime === "image/jpeg" ? ".jpg"
      : record.previewMime?.includes("wordprocessing") ? ".docx"
      : "";
    a.download = `record-${index + 1}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started");
  };

  return (
    <div>
      <PageHeader
        title="Patient Records"
        description="Retrieve and decrypt records from authorized patients."
      />

      {/* Search */}
      <Card className="glass p-5 mb-4">
        <form onSubmit={handleFetch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[260px]">
            <Label htmlFor="patient-addr">Patient Wallet Address</Label>
            <Input
              id="patient-addr"
              value={patientAddr}
              onChange={(e) => setPatientAddr(e.target.value)}
              placeholder="0x…"
              className="font-mono mt-1"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !isConnected || !isCorrectNetwork}
            className="bg-hero text-primary-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Fetch Records
              </>
            )}
          </Button>
        </form>
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2">Connect MetaMask to fetch records.</p>
        )}
        {isConnected && !isCorrectNetwork && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Switch to Sepolia Testnet.
          </p>
        )}
      </Card>

      {/* Access banner */}
      {searched && hasAccess !== null && (
        <div
          className={`mb-4 rounded-xl border p-3 flex items-center gap-2 text-sm ${hasAccess ? "border-accent/40 bg-accent/10" : "border-destructive/40 bg-destructive/10 text-destructive"}`}
        >
          {hasAccess ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
          ) : (
            <ShieldOff className="h-4 w-4 shrink-0" />
          )}
          {hasAccess
            ? "Access verified — records retrieved from blockchain."
            : "Access denied or expired. Ask the patient to grant you access."}
        </div>
      )}

      {/* Records table */}
      <Card className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Record Type</TableHead>
              <TableHead>IPFS CID</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{shortAddr(patientAddr)}</TableCell>
                <TableCell className="font-medium">{r.recordType}</TableCell>
                <TableCell className="font-mono text-xs">
                  {isRealCid(r.ipfsHash) ? (
                    <span className="text-primary">{r.ipfsHash.slice(0, 14)}…</span>
                  ) : (
                    <span className="text-muted-foreground">dummy CID</span>
                  )}
                </TableCell>
                <TableCell>{new Date(r.timestamp * 1000).toLocaleDateString()}</TableCell>
                <TableCell className="font-mono text-xs">{shortAddr(r.uploadedBy)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {isRealCid(r.ipfsHash) && !r.previewUrl && (
                      <Button size="sm" variant="outline" onClick={() => openDecryptDialog(i)}>
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Decrypt
                      </Button>
                    )}
                    {r.previewUrl && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          title="View inline below"
                          onClick={() => {
                            const el = document.getElementById(`preview-${i}`);
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Download"
                          onClick={() => handleDownload(i)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {!isRealCid(r.ipfsHash) && (
                      <span className="text-xs text-muted-foreground italic">No file</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {searched && records.length === 0 && hasAccess && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No records found.
                </TableCell>
              </TableRow>
            )}
            {!searched && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Enter a patient address above to fetch records.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Inline preview area */}
      {records.some((r) => r.previewUrl) && (
        <div className="mt-4 space-y-4">
          {records.map((r, i) =>
            r.previewUrl ? (
              <Card key={i} id={`preview-${i}`} className="glass p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{r.recordType} — Decrypted Preview</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      URL.revokeObjectURL(r.previewUrl!);
                      setRecords((prev) =>
                        prev.map((rec, idx) =>
                          idx === i ? { ...rec, previewUrl: undefined } : rec,
                        ),
                      );
                    }}
                  >
                    Close
                  </Button>
                </div>
                {r.previewMime === "application/pdf" ? (
                  <iframe
                    src={r.previewUrl}
                    className="w-full h-[600px] rounded-lg border border-border"
                    title="PDF"
                  />
                ) : r.previewMime?.startsWith("image/") ? (
                  <img
                    src={r.previewUrl}
                    alt="Record"
                    className="max-w-full rounded-lg border border-border"
                  />
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">
                      File decrypted successfully. Click Download to save it.
                    </p>
                    <Button onClick={() => handleDownload(records.indexOf(r))}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </Card>
            ) : null,
          )}
        </div>
      )}

      {/* Decrypt dialog */}
      <Dialog open={decryptOpen} onOpenChange={setDecryptOpen}>
        <DialogContent className="sm:max-w-md glass border border-border/60">
          <DialogHeader>
            <DialogTitle>Decrypt Medical Record</DialogTitle>
            <DialogDescription>
              Enter the AES-256 decryption key provided by the patient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="aes-key">AES Decryption Key</Label>
              <Input
                id="aes-key"
                value={aesKeyInput}
                onChange={(e) => setAesKeyInput(e.target.value)}
                placeholder="64-character hex key…"
                className="font-mono text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="file-ext">File Type</Label>
              <select
                id="file-ext"
                value={fileExtInput}
                onChange={(e) => setFileExtInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
                <option value="jpg">JPG / JPEG</option>
                <option value="docx">DOCX</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              The patient can find the key by clicking the 🔑 icon on their My Records page.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecryptOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDecrypt}
              disabled={decrypting}
              className="bg-hero text-primary-foreground"
            >
              {decrypting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Decrypting…
                </>
              ) : (
                "Decrypt & View"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
