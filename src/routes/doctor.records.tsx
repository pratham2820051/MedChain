import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortAddr } from "@/lib/mock-store";
import { getRecords, checkAccess, parseContractError, type ChainRecord } from "@/services/medchainService";
import { buildGatewayUrl, isRealCid } from "@/services/ipfsService";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, ShieldCheck, ShieldOff, ExternalLink, Download } from "lucide-react";

export const Route = createFileRoute("/doctor/records")({
  head: () => ({ meta: [{ title: "Patient Records — MedChain" }] }),
  component: PatientRecords,
});

function PatientRecords() {
  const { isConnected, isCorrectNetwork, walletAddress } = useWallet();
  const [patientAddr, setPatientAddr] = useState("");
  const [records, setRecords] = useState<ChainRecord[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientAddr) { toast.error("Enter a patient address."); return; }
    if (!/^0x[a-fA-F0-9]{40}$/.test(patientAddr)) { toast.error("Invalid patient wallet address."); return; }
    if (!isConnected || !isCorrectNetwork) { toast.error("Connect MetaMask on Sepolia first."); return; }

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

  const handleOpen = (cid: string) => {
    const url = buildGatewayUrl(cid);
    if (!url) { toast.error("No IPFS file for this record."); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (index: number, cid: string, recordType: string) => {
    const url = buildGatewayUrl(cid);
    if (!url) { toast.error("No IPFS file for this record."); return; }
    setDownloading(index);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${recordType}-${index + 1}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Patient Records" description="Retrieve records from patients who have granted you access." />

      {/* Search */}
      <Card className="glass p-5 mb-4">
        <form onSubmit={handleFetch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[260px]">
            <Label htmlFor="patient-addr">Patient Wallet Address</Label>
            <Input id="patient-addr" value={patientAddr} onChange={(e) => setPatientAddr(e.target.value)} placeholder="0x…" className="font-mono mt-1" />
          </div>
          <Button type="submit" disabled={loading || !isConnected || !isCorrectNetwork} className="bg-hero text-primary-foreground">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fetching…</> : <><Search className="h-4 w-4 mr-2" />Fetch Records</>}
          </Button>
        </form>
        {!isConnected && <p className="text-xs text-muted-foreground mt-2">Connect MetaMask to fetch records.</p>}
        {isConnected && !isCorrectNetwork && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Switch to Sepolia Testnet.</p>}
      </Card>

      {/* Access banner */}
      {searched && hasAccess !== null && (
        <div className={`mb-4 rounded-xl border p-3 flex items-center gap-2 text-sm ${hasAccess ? "border-accent/40 bg-accent/10" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
          {hasAccess ? <ShieldCheck className="h-4 w-4 shrink-0 text-accent" /> : <ShieldOff className="h-4 w-4 shrink-0" />}
          {hasAccess ? "Access verified — records retrieved from blockchain." : "Access denied or expired. Ask the patient to grant you access."}
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
                  {isRealCid(r.ipfsHash)
                    ? <span className="text-primary">{r.ipfsHash.slice(0, 14)}…</span>
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>{new Date(r.timestamp * 1000).toLocaleDateString()}</TableCell>
                <TableCell className="font-mono text-xs">{shortAddr(r.uploadedBy)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {isRealCid(r.ipfsHash) ? (
                      <>
                        <Button size="icon" variant="ghost" title="Open file" onClick={() => handleOpen(r.ipfsHash)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Download" disabled={downloading === i} onClick={() => handleDownload(i, r.ipfsHash, r.recordType)}>
                          {downloading === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No file</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {searched && records.length === 0 && hasAccess && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No records found.</TableCell></TableRow>
            )}
            {!searched && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Enter a patient address above to fetch records.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
