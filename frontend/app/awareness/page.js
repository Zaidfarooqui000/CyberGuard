'use client';

// Cybersecurity Awareness – educational topics + admin-managed security tips.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Bug, Lock, Users, Globe, Fingerprint, ShieldCheck, MailWarning, Lightbulb, ChevronRight, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Spinner } from '@/components/ui';
import { topics } from '@/lib/awarenessContent';
import { api } from '@/lib/api';

const ICONS = { Mail, Bug, Lock, Users, Globe, Fingerprint, ShieldCheck, MailWarning };

export default function AwarenessPage() {
  const [openId, setOpenId] = useState(topics[0].id);
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [tipsError, setTipsError] = useState('');

  useEffect(() => {
    api('/tips', { auth: false })
      .then((data) => setTips(data.tips))
      .catch((err) => setTipsError(err.message))
      .finally(() => setTipsLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-navy-700/70">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
          <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <BookOpen className="h-3.5 w-3.5" /> Cybersecurity Awareness
            </span>
            <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Learn to recognize cyber threats</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Most attacks succeed because people are tricked, not because computers are hacked. Understanding the common
              techniques is your strongest defence.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
          {/* Topics accordion */}
          <div className="space-y-3 lg:col-span-2">
            {topics.map((t) => {
              const Icon = ICONS[t.icon] || ShieldCheck;
              const open = openId === t.id;
              return (
                <div key={t.id} id={t.id} className={`card scroll-mt-24 p-0 transition ${open ? 'border-cyan-500/40' : ''}`}>
                  <button
                    onClick={() => setOpenId(open ? null : t.id)}
                    className="flex w-full items-center gap-4 p-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-white">{t.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-400">{t.summary}</span>
                    </span>
                    <ChevronRight className={`h-5 w-5 shrink-0 text-slate-500 transition ${open ? 'rotate-90 text-cyan-400' : ''}`} />
                  </button>
                  {open && (
                    <ul className="space-y-2 border-t border-navy-700 px-5 py-4 pl-[4.75rem] text-sm text-slate-300 animate-fade-up">
                      {t.points.map((p) => (
                        <li key={p} className="list-disc marker:text-cyan-400">{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tips from the database */}
          <aside className="space-y-4">
            <div className="card">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Lightbulb className="h-5 w-5 text-yellow-400" /> Security tips
              </h2>
              {tipsLoading && <Spinner label="Loading tips…" />}
              {tipsError && <p className="text-sm text-slate-400">Tips are unavailable right now ({tipsError}).</p>}
              {!tipsLoading && !tipsError && tips.length === 0 && <p className="text-sm text-slate-400">No tips have been published yet.</p>}
              <ul className="space-y-4">
                {tips.map((tip) => (
                  <li key={tip.id} className="rounded-xl border border-navy-700 bg-navy-850 p-4">
                    <p className="font-medium text-cyan-200">{tip.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-400">{tip.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card border-cyan-500/30 text-center">
              <p className="font-semibold text-white">Received something suspicious?</p>
              <p className="mt-1 text-sm text-slate-400">Check it with our URL and email scanners.</p>
              <Link href="/dashboard/scan-url" className="btn-primary mt-4 w-full">Scan now</Link>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
