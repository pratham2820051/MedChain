import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Activity, Shield, FileLock2, Users, History, Share2, Lock,
  ArrowRight, CheckCircle2, Zap, Star,
} from "lucide-react";

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
  {
    icon: Users,
    title: "Patient Ownership",
    desc: "You hold the cryptographic keys to every record in your name. No third party can access without your consent.",
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-600",
  },
  {
    icon: FileLock2,
    title: "Secure Encrypted Vaults",
    desc: "End-to-end encrypted storage for every document. Even we cannot read your files.",
    color: "from-violet-500/20 to-violet-600/10",
    iconColor: "text-violet-600",
  },
  {
    icon: Shield,
    title: "Doctor Access Control",
    desc: "Grant time-bound, revocable access to clinicians in a single click. Full granular control.",
    color: "from-teal-500/20 to-teal-600/10",
    iconColor: "text-teal-600",
  },
  {
    icon: History,
    title: "Immutable Audit Trail",
    desc: "Every view, share, and change is logged on-chain. Tamper-proof transparency you can trust.",
    color: "from-orange-500/20 to-orange-600/10",
    iconColor: "text-orange-600",
  },
  {
    icon: Share2,
    title: "Secure Record Sharing",
    desc: "Share lab work, scans, and prescriptions with your care team safely and securely.",
    color: "from-pink-500/20 to-pink-600/10",
    iconColor: "text-pink-600",
  },
  {
    icon: Lock,
    title: "Privacy First",
    desc: "Your data is never sold, analyzed, or shared without explicit patient-signed consent.",
    color: "from-green-500/20 to-green-600/10",
    iconColor: "text-green-600",
  },
];

const stats = [
  { value: "256-bit", label: "Encryption Standard" },
  { value: "100%", label: "Patient Controlled" },
  { value: "0ms", label: "Data Sold to 3rd Parties" },
  { value: "∞", label: "Audit Log Retention" },
];

const trust = [
  "No account needed — just a wallet",
  "Records encrypted before they leave your device",
  "Doctor access expires automatically",
  "Every action is permanently logged on-chain",
];

function Landing() {
  return (
    <div className="min-h-screen bg-soft overflow-x-hidden">

      {/* ── STICKY NAV ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-soft/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-5 lg:px-10 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-hero flex items-center justify-center text-white shadow-glow transition-transform group-hover:scale-105">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">MedChain</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="nav-link hover:text-foreground">Features</a>
            <a href="#trust"    className="nav-link hover:text-foreground">Security</a>
            <a href="#footer"   className="nav-link hover:text-foreground">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/connect">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-hero text-white hover:opacity-90 shadow-card">
              <Link to="/connect">Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative px-5 lg:px-10 pt-20 pb-28 lg:pt-32 lg:pb-36 text-center max-w-5xl mx-auto overflow-hidden">
        {/* Animated background blobs */}
        <div className="blob absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/25" />
        <div className="blob blob-2 absolute -bottom-16 -right-24 w-[420px] h-[420px] bg-accent/20" />
        <div className="blob blob-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-400/15" />

        <div className="relative">
          {/* Badge */}
          <div className="fade-in-up inline-flex items-center gap-2.5 rounded-full glass px-4 py-2 text-xs font-semibold mb-8 text-foreground/80 shadow-card">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Blockchain-secured · Patient-first · Zero-knowledge
          </div>

          {/* Headline */}
          <h1 className="fade-in-up delay-100 text-5xl sm:text-6xl lg:text-[82px] font-extrabold tracking-tight leading-[1.05] text-foreground">
            Own Your<br />
            <span className="gradient-text">Medical Records</span>
          </h1>

          {/* Sub-copy */}
          <p className="fade-in-up delay-200 mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Secure, transparent healthcare data management on the blockchain.
            Decide who sees your history — and revoke it in one tap.
          </p>

          {/* CTAs */}
          <div className="fade-in-up delay-300 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-hero text-white hover:opacity-90 shadow-glow px-8 text-base font-semibold rounded-xl"
            >
              <Link to="/connect">
                Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-border/80 hover:bg-secondary/50 px-8 text-base font-semibold rounded-xl backdrop-blur"
            >
              <Link to="/connect">Connect Wallet</Link>
            </Button>
          </div>

          {/* Social proof strip */}
          <div className="fade-in-up delay-300 mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            {trust.slice(0, 2).map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 lg:px-10 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black gradient-text">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="px-5 lg:px-10 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-muted-foreground mb-4">
            <Zap className="h-3.5 w-3.5 text-accent" /> Powered by cryptography
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Built for trust, designed for <span className="gradient-text">simplicity</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Everything you need to take back control of your healthcare data.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card
              key={f.title}
              className="feature-card glass p-6 group cursor-default"
            >
              <div className={`icon-ring h-12 w-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5`}>
                <f.icon className={`h-5 w-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-bold text-base mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── TRUST SECTION ────────────────────────────────── */}
      <section id="trust" className="px-5 lg:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-10 lg:p-14 flex flex-col lg:flex-row items-center gap-10">
            {/* Left copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground mb-4">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" /> Security-first design
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-4">
                Your data, your rules.<br />
                <span className="gradient-text">Always.</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-7 max-w-md">
                MedChain is architected so that even we cannot access your data.
                All encryption happens on your device before anything reaches our servers.
              </p>
              <Button asChild className="bg-hero text-white hover:opacity-90 rounded-xl font-semibold shadow-glow">
                <Link to="/connect">Start Protecting Your Records <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </div>

            {/* Right checklist */}
            <ul className="flex-1 space-y-4">
              {trust.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="px-5 lg:px-10 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl bg-hero p-12 lg:p-16 overflow-hidden shadow-glow">
            {/* Decorative orbs inside banner */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Ready to own your health data?
              </h2>
              <p className="text-white/80 text-sm sm:text-base mb-8 max-w-lg mx-auto">
                Join patients who've taken control. Connect your wallet in seconds — no account, no email required.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-foreground hover:bg-white/90 font-bold px-8 rounded-xl shadow-lift"
              >
                <Link to="/connect">
                  Connect Wallet <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer id="footer" className="border-t border-border/50 bg-card/40 backdrop-blur mt-4">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-12 grid sm:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-xl bg-hero flex items-center justify-center text-white shadow-card">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-bold text-base">MedChain</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[200px]">
              Patient-owned, blockchain-secured medical records for the modern era.
            </p>
          </div>

          <div>
            <div className="font-semibold mb-3 text-foreground/90">Product</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#trust" className="hover:text-foreground transition-colors">Security</a></li>
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-3 text-foreground/90">Company</div>
            <ul className="space-y-2 text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">About</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Contact</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-3 text-foreground/90">Legal</div>
            <ul className="space-y-2 text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MedChain. All rights reserved. Built with 💙 for patient privacy.
        </div>
      </footer>
    </div>
  );
}
