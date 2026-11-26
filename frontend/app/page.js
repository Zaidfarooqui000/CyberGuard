// Landing page
import Link from 'next/link';
import {
  Link2, Mail, FileText, History, BookOpen, LayoutDashboard, ShieldCheck, ArrowRight,
  Lock, Fingerprint, TriangleAlert, CircleCheck, Radar,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const features = [
  { icon: Link2, title: 'URL Phishing Detection', text: '8 transparent checks: HTTPS, IP hosts, URL length, symbols, shorteners, keywords, suspicious domains and brand impersonation.' },
  { icon: Mail, title: 'Email Phishing Detection', text: 'Detects urgent language, fake verification requests, credential requests, prize scams, risky links, sender mismatch and spelling red flags.' },
  { icon: FileText, title: 'Professional Reports', text: 'Every scan produces a 0–100 risk score with explanations and recommendations – print it or download it as a PDF.' },
  { icon: History, title: 'Scan History', text: 'Your results are saved securely so you can review, re-open or delete them at any time.' },
  { icon: BookOpen, title: 'Security Awareness', text: 'Learn about phishing, malware, ransomware, social engineering and how to protect your accounts.' },
  { icon: LayoutDashboard, title: 'Admin Dashboard', text: 'Admins monitor users, scan statistics, high-risk detections and system activity logs.' },
];

const steps = [
  { n: '01', title: 'Submit', text: 'Paste a suspicious link or email. Links are never opened or executed.' },
  { n: '02', title: 'Analyze', text: 'Explainable rules check for known phishing indicators and add up a risk score.' },
  { n: '03', title: 'Act', text: 'Read why the content was flagged and follow the recommended actions.' },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <div className="absolute left-1/2 top-0 h-96 w-[48rem] max-w-full -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                <Radar className="h-3.5 w-3.5" /> Information Security Project
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                Spot phishing <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">before</span> it spots you.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">
                CyberGuard analyzes suspicious URLs and emails with transparent, rule-based detection and explains every
                warning sign – so you understand the risk, not just a verdict.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary px-6 py-3 text-base">
                  Start scanning free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/awareness" className="btn-secondary px-6 py-3 text-base">
                  Learn about phishing
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-cyan-400" /> bcrypt + JWT security</span>
                <span className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan-400" /> No links are opened</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400" /> Explainable results</span>
              </div>
            </div>

            {/* Illustrative mock report */}
            <div className="relative mx-auto w-full max-w-md animate-float">
              <div className="card relative overflow-hidden border-cyan-500/30">
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
                <p className="text-xs uppercase tracking-wider text-slate-500">Example analysis</p>
                <p className="mt-2 break-all font-mono text-sm text-slate-200">http://paypa1-secure.com/login/verify</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" /> HIGH RISK
                  </span>
                  <span className="text-2xl font-bold text-white">68<span className="text-sm text-slate-400">/100</span></span>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex gap-2 text-slate-300"><TriangleAlert className="h-4 w-4 shrink-0 text-red-400" /> Look-alike domain imitating “paypal”</li>
                  <li className="flex gap-2 text-slate-300"><TriangleAlert className="h-4 w-4 shrink-0 text-yellow-400" /> No HTTPS encryption</li>
                  <li className="flex gap-2 text-slate-300"><TriangleAlert className="h-4 w-4 shrink-0 text-yellow-400" /> Keywords: login, verify</li>
                  <li className="flex gap-2 text-slate-300"><CircleCheck className="h-4 w-4 shrink-0 text-green-400" /> Not a URL shortener</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Everything you need to stay safe</h2>
            <p className="mt-3 text-slate-400">A complete toolkit for detecting phishing attempts and building security awareness.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="card group transition hover:-translate-y-1 hover:border-cyan-500/40 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30 transition group-hover:scale-110">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-navy-700/70 bg-navy-900/50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-3xl font-bold text-white">How it works</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="relative rounded-2xl border border-navy-700 bg-navy-900 p-6">
                  <span className="text-4xl font-black text-cyan-500/30">{s.n}</span>
                  <h3 className="mt-2 text-xl font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-center"><p className="font-bold text-green-400">SAFE</p><p className="text-xs text-slate-400">Score 0 – 29</p></div>
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-center"><p className="font-bold text-yellow-400">SUSPICIOUS</p><p className="text-xs text-slate-400">Score 30 – 59</p></div>
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-center"><p className="font-bold text-red-400">HIGH RISK</p><p className="text-xs text-slate-400">Score 60 – 100</p></div>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-500">
              CyberGuard uses transparent rule-based analysis – not AI or machine learning. Automated analysis cannot
              guarantee that a website or email is safe.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-blue-700/40 via-navy-900 to-cyan-600/20 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-bold text-white">Got a suspicious message?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">Create a free account and get an explained risk report in seconds.</p>
            <Link href="/register" className="btn-primary mt-6 px-6 py-3 text-base">
              Create account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
