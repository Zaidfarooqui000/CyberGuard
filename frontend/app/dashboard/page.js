'use client';

// User dashboard: statistics, charts and recent scans.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScanLine, ShieldCheck, TriangleAlert, ShieldAlert, Mail, Link2, History, ArrowRight } from 'lucide-react';
import { PageHeader, StatCard, Spinner, Alert, RiskBadge, EmptyState } from '@/components/ui';
import { RiskDoughnut, ActivityLine, RiskComparisonBar } from '@/components/Charts';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { formatDate, truncate } from '@/lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="Loading dashboard…" />;

  const { url, email } = data;
  const allSafe = url.SAFE + email.SAFE;
  const allSusp = url.SUSPICIOUS + email.SUSPICIOUS;
  const allHigh = url['HIGH RISK'] + email['HIGH RISK'];

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} subtitle="Your personal security activity overview.">
        <Link href="/dashboard/scan-url" className="btn-primary"><Link2 className="h-4 w-4" /> Scan URL</Link>
        <Link href="/dashboard/scan-email" className="btn-secondary"><Mail className="h-4 w-4" /> Scan Email</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Scans" value={data.totalScans} icon={ScanLine} accent="cyan" hint={`${url.total} URL · ${email.total} email`} />
        <StatCard label="Safe URLs" value={url.SAFE} icon={ShieldCheck} accent="green" />
        <StatCard label="Suspicious URLs" value={url.SUSPICIOUS} icon={TriangleAlert} accent="yellow" />
        <StatCard label="High-Risk URLs" value={url['HIGH RISK']} icon={ShieldAlert} accent="red" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Email Scans" value={email.total} icon={Mail} accent="blue" />
        <StatCard label="Safe Emails" value={email.SAFE} icon={ShieldCheck} accent="green" />
        <StatCard label="Suspicious Emails" value={email.SUSPICIOUS} icon={TriangleAlert} accent="yellow" />
        <StatCard label="High-Risk Emails" value={email['HIGH RISK']} icon={ShieldAlert} accent="red" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-4 font-semibold text-white">Risk distribution</h2>
          <RiskDoughnut safe={allSafe} suspicious={allSusp} high={allHigh} />
        </div>
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold text-white">Security activity (last 7 days)</h2>
          <ActivityLine daily={data.daily} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="mb-4 font-semibold text-white">URL vs email results</h2>
          <RiskComparisonBar url={url} email={email} />
        </div>
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent scan history</h2>
            <Link href="/dashboard/history" className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {data.recent.length === 0 ? (
            <EmptyState icon={History} title="No scans yet" text="Run your first URL or email scan to see results here.">
              <Link href="/dashboard/scan-url" className="btn-primary">Start scanning</Link>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-navy-700">
              {data.recent.map((s) => (
                <li key={s.type + s.id}>
                  <Link href={`/dashboard/report/${s.type}/${s.id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-navy-800">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-800 text-cyan-300">
                      {s.type === 'url' ? <Link2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm text-slate-200">{truncate(s.target, 70)}</p>
                      <p className="text-xs text-slate-500">{formatDate(s.scanned_at)} · score {s.risk_score}</p>
                    </div>
                    <RiskBadge level={s.risk_level} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
