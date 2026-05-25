import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { uploadRecord, type RecordType } from "@/lib/mock-store";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

export const Route = createFileRoute("/patient/upload")({
  head: () => ({ meta: [{ title: "Upload Record — MedChain" }] }),
  component: UploadPage,
});

const types: RecordType[] = ["Lab Report", "Prescription", "Scan", "X-Ray", "MRI", "Other"];

function UploadPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<RecordType>("Lab Report");
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) { toast.error("Please provide a name and file."); return; }
    setBusy(true);
    setProgress(0);
    const iv = setInterval(() => setProgress((p) => Math.min(p + 12, 90)), 100);
    try {
      await uploadRecord({ name, type, fileName: file.name, description: desc });
      clearInterval(iv);
      setProgress(100);
      toast.success("Record uploaded");
      setTimeout(() => navigate({ to: "/patient/records" }), 400);
    } catch {
      clearInterval(iv);
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Upload Medical Record" description="Add a new document to your encrypted vault." />
      <Card className="glass p-6">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label>Upload File</Label>
            <label className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 p-8 cursor-pointer hover:bg-secondary/50 transition">
              <UploadCloud className="h-7 w-7 text-primary" />
              <span className="text-sm">{file ? file.name : "Click to choose a file"}</span>
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG, DICOM up to 50MB</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div>
            <Label htmlFor="name">Record Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Blood Panel" />
          </div>
          <div>
            <Label>Record Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as RecordType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>

          {busy && <Progress value={progress} />}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/patient/dashboard" })}>Cancel</Button>
            <Button type="submit" disabled={busy} className="bg-hero text-primary-foreground">{busy ? "Uploading…" : "Upload Record"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
