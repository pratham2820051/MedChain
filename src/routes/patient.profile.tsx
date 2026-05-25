import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore, updateProfile } from "@/lib/mock-store";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/profile")({
  head: () => ({ meta: [{ title: "Profile — MedChain" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useStore((s) => s.profile);
  const wallet = useStore((s) => s.wallet);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Patient Profile" />
      <Card className="glass p-6 space-y-5">
        <Field label="Wallet Address" value={wallet ?? profile.address} mono readOnly />
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} readOnly={!edit} />
        <Field label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} readOnly={!edit} />
        <Field label="Phone Number" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} readOnly={!edit} />
        <div className="flex gap-2 justify-end">
          {!edit ? (
            <Button onClick={() => setEdit(true)}>Edit Profile</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setForm(profile); setEdit(false); }}>Cancel</Button>
              <Button className="bg-hero text-primary-foreground" onClick={() => { updateProfile(form); setEdit(false); toast.success("Profile saved"); }}>Save Changes</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, readOnly, mono }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; mono?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange?.(e.target.value)} readOnly={readOnly} className={mono ? "font-mono text-xs" : ""} />
    </div>
  );
}
