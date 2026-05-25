import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Shield, FileLock2, Users, History, Share2, Lock, Upload, KeyRound, Send, Eye } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedChain — Own Your Medical Records" },
      { name: "description", content: "Secure, transparent healthcare data management. Patients control access to their medical records." },
      { property: "og:title", content: "MedChain — Own Your Medical Records" },
      { property: "og:description", content: "Secure, transparent healthcare data management." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Users, title: "Patient Ownership", desc: "You hold the keys to every record in your name." },
  { icon: FileLock2, title: "Secure Storage", desc: "End-to-end encrypted vaults for every document." },
  { icon: Shield, title: "Doctor Access Management", desc: "Grant, expire, or revoke access in one click." },
  { icon: History, title: "Audit Trail", desc: "Immutable log of every view, share, and change." },
  { icon: Share2, title: "Medical Record Sharing", desc: "Share lab work, scans, and prescriptions safely." },
  { icon: Lock, title: "Privacy Protection", desc: "No data is shared without your explicit consent." },
];

const steps = [
  { icon: Upload, title: "Upload Records", desc: "Add labs, scans, and prescriptions." },
  { icon: KeyRound, title: "Manage Access", desc: "Authorize trusted clinicians." },
  { icon: Send, title: "Share Securely", desc: "Time-bound, encrypted sharing." },
  { icon: Eye, title: "Track Activity", desc: "See exactly who viewed what." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-soft">
      <header className="flex items-center justify-between px-6 lg:px-12 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-hero flex items-center justify-center text-primary-foreground shadow-card">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg">MedChain</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#footer" className="hover:text-foreground">Contact</a>
        </nav>
        <Button asChild variant="outline" size="sm"><Link to="/connect">Connect Wallet</Link></Button>
      </header>

      <section className="px-6 lg:px-12 pt-10 pb-20 lg:pt-20 lg:pb-28 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium mb-6">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> Patient-first health data
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
          Own Your <span className="bg-hero bg-clip-text text-transparent">Medical Records</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Secure, transparent healthcare data management. Decide who sees your history — and when.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-hero text-primary-foreground hover:opacity-95">
            <Link to="/connect">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline"><Link to="/connect">Connect Wallet</Link></Button>
        </div>
      </section>

      <section id="features" className="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">Built for trust</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="glass p-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" className="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <Card key={s.title} className="glass p-6 relative overflow-hidden">
              <div className="absolute -top-6 -right-4 text-7xl font-bold text-primary/5">{i + 1}</div>
              <div className="h-10 w-10 rounded-xl bg-accent/30 text-foreground flex items-center justify-center mb-4">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer id="footer" className="border-t border-border/60 mt-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 grid sm:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-hero" />
              <span className="font-semibold">MedChain</span>
            </div>
            <p className="text-muted-foreground">Patient-owned medical records.</p>
          </div>
          <div>
            <div className="font-medium mb-2">Product</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Company</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>About</li><li>Contact</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Legal</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>Privacy Policy</li><li>Terms</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} MedChain</div>
      </footer>
    </div>
  );
}
