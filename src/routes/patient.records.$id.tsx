import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, grantAccess, shortAddr } from "@/lib/mock-store";
import { openIpfsFile, downloadFromIPFS, isRealCid } from "@/services/ipfsService";
import { Download, Share2, History, FileText, Loader2, ExternalLink, Link2 } from "lucide-react";
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
  const [downloading, setDownloading] = useState(false);

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

  const handleDownload = async () => {
    if (!record?.ipfsCid || !isRealCid(record.ipfsCid)) {
      toast.error("No IPFS file attached to this record.");
      return;
    }
    setDownloading(true);
    try {
      await downloadFromIPFS(record.ipfsCid, record.fileName ?? record.name);
      toast.success("Download started");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDownloading(false);
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

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={record.name}
        description={`${record.type} · uploaded ${record.uploadDate}`}
        action={
          <div className="flex gap-2 flex-wrap">
            {/* Open in IPFS */}
            {hasCid && (
              <Button variant="outline" onClick={() => {
                try { openIpfsFile(record.ipfsCid!); }
                catch (err: unknown) { toast.error((err as Error).message); }
              }}>
                <ExternalLink className="h-4 w-4 mr-2" />Open File
              </Button>
            )}

            {/* Download */}
            {hasCid && (
              <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                {downloading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Downloading…</>
                  : <><Download className="h-4 w-4 mr-2" />Download</>}
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
                  <DialogDescription>Grant a doctor blockchain access to this record.</DialogDescription>
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
                  <ExternalLink className="h-3 w-3" />View on IPFS Gateway
                </a>
              )}
            </div>
          </div>
        )}
      </Card>

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
