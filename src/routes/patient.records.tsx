import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, deleteRecord, type RecordType } from "@/lib/mock-store";
import { openIpfsFile, downloadFromIPFS, isRealCid } from "@/services/ipfsService";
import { useMemo, useState } from "react";
import { Download, Eye, ExternalLink, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/patient/records")({
  head: () => ({ meta: [{ title: "My Records — MedChain" }] }),
  component: RecordsPage,
});

const types: (RecordType | "All")[] = ["All", "Lab Report", "Prescription", "Scan", "X-Ray", "MRI", "Other"];

function RecordsPage() {
  const records = useStore((s) => s.records);
  const [q, setQ] = useState("");
  const [type, setType] = useState<RecordType | "All">("All");
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = useMemo(() =>
    records.filter((r) =>
      (type === "All" || r.type === type) &&
      (r.name.toLowerCase().includes(q.toLowerCase()) || r.type.toLowerCase().includes(q.toLowerCase()))
    ), [records, q, type]);

  const handleDownload = async (id: string, cid: string, fileName: string) => {
    if (!isRealCid(cid)) {
      toast.error("No IPFS file attached to this record.");
      return;
    }
    setDownloading(id);
    try {
      await downloadFromIPFS(cid, fileName);
      toast.success("Download started");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <PageHeader title="My Records" description="All your uploaded medical records." />
      <Card className="glass p-4">
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search records" className="pl-9" />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as RecordType | "All")}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>IPFS CID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.uploadDate}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {isRealCid(r.ipfsCid ?? "") ? (
                      <span className="text-primary">{r.ipfsCid!.slice(0, 14)}…</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs rounded-full bg-accent/30 px-2 py-0.5">{r.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* View details */}
                      <Button asChild size="icon" variant="ghost" title="View details">
                        <Link to="/patient/records/$id" params={{ id: r.id }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Open in IPFS */}
                      {isRealCid(r.ipfsCid ?? "") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Open in IPFS"
                          onClick={() => {
                            try { openIpfsFile(r.ipfsCid!); }
                            catch (err: unknown) { toast.error((err as Error).message); }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Download */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Download"
                        disabled={downloading === r.id}
                        onClick={() => handleDownload(r.id, r.ipfsCid ?? "", r.fileName ?? r.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the record from your local list. The file on IPFS remains pinned.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { deleteRecord(r.id); toast.success("Record deleted"); }}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
