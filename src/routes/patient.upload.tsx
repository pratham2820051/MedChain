import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { uploadRecord as mockUpload, type RecordType } from "@/lib/mock-store";
import { uploadRecord as chainUpload, parseContractError } from "@/services/medchainService";
import { uploadToIPFS, validateFile, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/services/ipfsService";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";
import { UploadCloud, Loader2, FileCheck2, Link2 } from "lucide-react";

export const Route = createFileRoute("/patient/upload")({
  head: () => ({ meta: [{ title: "Upload Record — MedChain" }] }),
  component: UploadPage,
});

const types: RecordType[] = ["Lab Report", "Prescription", "Scan", "X-Ray", "MRI", "Other"];

type UploadStep = "idle" | "validating" | "ipfs" | "blockchain" | "done";

const STEP_LABELS: Record<UploadStep, string> = {
  idle: "",
  validating: "Validating file…",
  ipfs: "Uploading file to IPFS…",
  blockchain: "Saving CID to blockchain…",
  done: "Upload complete!",
};

function UploadPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<RecordType>("Lab Report");
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<UploadStep>("idle");
  const [cid, setCid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { isConnected, isCorrectNetwork } = useWallet();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      try {
        validateFile(selected);
        setFile(selected);
      } catch (err: unknown) {
        toast.error((err as Error).message);
        e.target.value = "";
      }
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) { toast.error("Please provide a name and file."); return; }

    setBusy(true);
    setProgress(0);
    setCid(null);

    try {
      // Step 1: Validate
      setStep("validating");
      validateFile(file);
      setProgress(10);

      // Step 2: Upload original file directly to IPFS
      setStep("ipfs");
      const ipfsResult = await uploadToIPFS(file, name, (pct) => {
        setProgress(10 + Math.round(pct * 0.7));
      });
      const ipfsCid = ipfsResult.cid;
      const ipfsGatewayUrl = ipfsResult.gatewayUrl;
      setCid(ipfsCid);
      toast.success(`File uploaded to IPFS ✓`);
      setProgress(85);

      // Step 3: Save to local store
      await mockUpload({
        name,
        type,
        fileName: file.name,
        description: desc,
        ipfsCid,
        ipfsGatewayUrl,
        isEncrypted: false,
      });

      // Step 4: Save CID to blockchain
      if (isConnected && isCorrectNetwork) {
        setStep("blockchain");
        await chainUpload(type, ipfsCid);
        toast.success("CID saved to Sepolia blockchain ✓");
      } else {
        toast.info("Connect MetaMask on Sepolia to save CID on-chain.");
      }

      setProgress(100);
      setStep("done");
      setTimeout(() => navigate({ to: "/patient/records" }), 800);
    } catch (err) {
      setStep("idle");
      toast.error(parseContractError(err));
    } finally {
      setBusy(false);
    }
  };

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : null;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Upload Medical Record"
        description="Upload your medical file to IPFS and save the reference on blockchain."
      />
      <Card className="glass p-6">
        <form onSubmit={submit} className="space-y-5">

          {/* File drop zone */}
          <div>
            <Label>Medical File</Label>
            <label className={`mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition ${file ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:bg-secondary/50"}`}>
              {file ? (
                <>
                  <FileCheck2 className="h-7 w-7 text-primary" />
                  <span className="text-sm font-medium text-primary">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{fileSizeMB} MB · Click to change</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-7 w-7 text-primary" />
                  <span className="text-sm">Click to choose a file</span>
                  <span className="text-xs text-muted-foreground">
                    {ALLOWED_EXTENSIONS.join(", ")} · Max {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB
                  </span>
                </>
              )}
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={handleFileChange} />
            </label>
          </div>

          {/* Record name */}
          <div>
            <Label htmlFor="name">Record Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Blood Panel" required />
          </div>

          {/* Record type */}
          <div>
            <Label>Record Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as RecordType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>

          {/* Network status */}
          <div className="space-y-1">
            {isConnected && isCorrectNetwork && (
              <p className="text-xs text-muted-foreground">✅ MetaMask on Sepolia — CID will be saved on-chain.</p>
            )}
            {isConnected && !isCorrectNetwork && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">⚠️ Wrong network — switch to Sepolia.</p>
            )}
            {!isConnected && (
              <p className="text-xs text-muted-foreground">Connect MetaMask on Sepolia to save CID on-chain.</p>
            )}
          </div>

          {/* Progress */}
          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">{STEP_LABELS[step]}</p>
            </div>
          )}

          {/* CID result */}
          {cid && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 flex items-start gap-2 text-xs">
              <Link2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-accent-foreground">File pinned to IPFS</div>
                <div className="font-mono text-muted-foreground break-all mt-0.5">{cid}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/patient/dashboard" })} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy} className="bg-hero text-primary-foreground">
              {busy ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{STEP_LABELS[step] || "Uploading…"}</>
              ) : "Upload Record"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
