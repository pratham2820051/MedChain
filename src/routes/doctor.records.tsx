import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, shortAddr, downloadRecord } from "@/lib/mock-store";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/records")({
  head: () => ({ meta: [{ title: "Patient Records — MedChain" }] }),
  component: PatientRecords,
});

function PatientRecords() {
  const records = useStore((s) => s.records);

  return (
    <div>
      <PageHeader title="Patient Records" description="Records patients have shared with you." />
      <Card className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Patient</TableHead><TableHead>Record</TableHead><TableHead>Type</TableHead><TableHead>Upload Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{shortAddr(r.ownerAddress)}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.uploadDate}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => toast("Opening secure preview…")}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { downloadRecord(r.id); toast.success("Download started"); }}><Download className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
