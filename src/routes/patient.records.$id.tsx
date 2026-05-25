import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, grantAccess, shortAddr } from "@/lib/mock-store";
import { isRealCid, buildGatewayUrl } from "@/services/ipfsService";
import { decryptFromIPFS, hasKey, getKey } from "@/services/encryptionService";
import { Download, Share2, History, FileText, Loader2, ExternalLink, Link2, ShieldCheck, ShieldOff, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/patient/records/$id")({
  head: () => ({ meta: [{ title: "Record Details — MedChain" }] }),
  component: RecordDetail,
});

function RecordDetail() {
  const { id } = useParams({ from: "/patient/records/$id" });
  const record = useStore((s) => s.records.find((r) => r.id === id));
  const audit = useStore((s) =>
    s.audit.filter((a) => a.eventType === "View" || a.eventType === "Download").slice(0, 6)
  );

  const [open, setOpen] = useState(false);
  const [docAddr, setDocAddr] = useState("");
  const [expiry, setExpiry] = useState("");
  const [sharing, setSharing] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>("");

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docAddr || !expiry) { toast.error("Doctor address and expiry required."); return; }
    if (!/^0x[a-fA-F0-9]{40}$/.test(docAddr)) {
      toast.error("Please enter a valid doctor wallet address.");
      return;
    }
    setSharing(true);
    try {
      await grantAccess(docAddr, expiry);
      toast.success("Access granted successfully");
      setOpen(false);
      setDocAddr("");
      setExpiry("");
    } catch {
      toast.error("Failed to grant access");
    } finally {
      setSharing(false);
    }
  };

  const handleDecryptAndView = async () => {
    if (!record?.ipfsCid || !isRealCid(record.ipfsCid)) {
      toast.error("No IPFS file attached to this record.");
      return;
    }
    if (!record.isEncrypted) {
      // Not encrypted — open directly
      window.open(buildGatewayUrl(record.ipfsCid), "_blank", "noopener,noreferrer");
      return;
    }
    if (!hasKey(record.id)) {
      toast.error("Unable to decrypt — encryption key not found on this device.");
      return;
    }
    setDecrypting(true);
    try {
      const gatewayUrl = record.ipfsGatewayUrl || buildGatewayUrl(record.ipfsCid);
      const { objectUrl, mimeType } = await decryptFromIPFS(
        record.ipfsCid,
        record.id,
        record.fileName ?? record.name,
        gatewayUrl
      );
      setPreviewUrl(objectUrl);
      setPreviewMime(mimeType);
      toast.success("File decrypted successfully");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDecrypting(false);
    }
  };

  const handleDecryptAndDownload = async () => {
    if (!record?.ipfsCid || !isRealCid(record.ipfsCid)) {
      toast.error("No IPFS file attached to this record.");
      return;
    }
    setDecrypting(true);
    try {
      const gatewayUrl = record.ipfsGatewayUrl || buildGatewayUrl(record.ipfsCid);
      const { blob } = record.isEncrypted
        ? await decryptFromIPFS(record.ipfsCid, record.id, record.fileName ?? record.name, gatewayUrl)
        : { blob: await fetch(gatewayUrl).then((r) => r.blob()) };

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.fileName ?? record.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDecrypting(false);
    }
  };

  if (!record) {
    return (
      <div>
        <PageHeader title="Record not found" />
        <Button asChild variant="outline"><Link to="/patient/records">Back to records</Link></Button>
      </div>
    );
  }

  const hasCid = isRealCid(record.ipfsCid ?? "");
  const keyAvailable = hasKey(record.id);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={record.name}
        description={`${record.type} · uploaded ${record.uploadDate}`}
        action={
          <div className="flex gap-2 flex-wrap">
            {/* View / Decrypt */}
            {hasCid && (
              <Button
                variant="outline"
                onClick={handleDecryptAndView}
                disabled={decrypting}
              >
                {decrypting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Decrypting…</>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" />View File</>
                )}
              </Button>
            )}

            {/* Download */}
            {hasCid && (
              <Button variant="outline" onClick={handleDecryptAndDownload} disabled={decrypting}>
                <Download className="h-4 w-4 mr-2" />Download
              </Button>
            )}

            {/* Share */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-hero text-primary-foreground">
                  <Share2 className="h-4 w-4 mr-2" />Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass border border-border/60">
                <DialogHeader>
                  <DialogTitle>Share Medical Record</DialogTitle>
                  <DialogDescription>
                    Grant a doctor blockchain access to this record.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleShare} className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label htmlFor="doc-addr">Doctor Wallet Address</Label>
                    <Input id="doc-addr" placeholder="0x..." value={docAddr} onChange={(e) => setDocAddr(e.target.value)} className="font-mono text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
                  </div>
                  {/* Show AES key for doctor to use */}
                  {record.isEncrypted && keyAvailable && (
                    <div className="space-y-1">
                      <Label>Decryption Key (share with doctor)</Label>
                      <div className="rounded-lg bg-secondary/40 p-2 font-mono text-xs break-all select-all">
                        {getKey(record.id)}
                      </div>
                      <p className="text-xs text-muted-foreground">Doctor needs this key to decrypt the file.</p>
                    </div>
                  )}
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={sharing} className="bg-hero text-primary-foreground">
                      {sharing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sharing...</> : "Grant Access"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Record metadata */}
      <Card className="glass p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="h-7 w-7" />
          </div>
          <div className="flex-1 grid sm:grid-cols-2 gap-3 text-sm">
            <Info label="Record Type" value={record.type} />
            <Info label="Upload Date" value={record.uploadDate} />
            <Info label="Status" value={record.status} />
            <Info label="File" value={record.fileName ?? "—"} />
            <div className="sm:col-span-2"><Info label="Description" value={record.description ?? "—"} /></div>
          </div>
        </div>

        {/* Encryption status */}
        <div className="mt-4 flex items-center gap-2 text-xs">
          {record.isEncrypted ? (
            <>
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-accent-foreground font-medium">AES-256 Encrypted</span>
              {keyAvailable
                ? <span className="text-muted-foreground">· Decryption key available on this device</span>
                : <span className="text-destructive">· Key not found on this device</span>}
            </>
          ) : (
            <>
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Not encrypted (uploaded before Phase 5)</span>
            </>
          )}
        </div>

        {/* IPFS CID */}
        {hasCid && (
          <div className="mt-5 pt-5 border-t border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">IPFS Reference</span>
            </div>
            <div className="rounded-lg bg-secondary/40 p-3 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">CID</div>
              <div className="font-mono text-xs break-all">{record.ipfsCid}</div>
              {record.ipfsGatewayUrl && (
                <a href={record.ipfsGatewayUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="h-3 w-3" />
                  View raw encrypted file on IPFS
                </a>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Inline preview */}
      {previewUrl && (
        <Card className="glass p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Decrypted Preview</h2>
            <Button size="sm" variant="ghost" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
              Close
            </Button>
          </div>
          {previewMime === "application/pdf" ? (
            <iframe src={previewUrl} className="w-full h-[600px] rounded-lg border border-border" title="PDF Preview" />
          ) : previewMime.startsWith("image/") ? (
            <img src={previewUrl} alt="Medical record" className="max-w-full rounded-lg border border-border" />
          ) : (
            <p className="text-sm text-muted-foreground">Preview not available for this file type. Use Download instead.</p>
          )}
        </Card>
      )}

      {/* Access history */}
      <Card className="glass p-6 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Access History</h2>
        </div>
        <ul className="divide-y divide-border">
          {audit.map((a) => (
            <li key={a.id} className="py-2 flex items-center justify-between text-sm">
              <span>{a.eventType} · {shortAddr(a.walletAddress)}</span>
              <span className="text-muted-foreground text-xs">{new Date(a.timestamp).toLocaleString()}</span>
            </li>
          ))}
          {audit.length === 0 && <li className="text-sm text-muted-foreground py-2">No access events yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
