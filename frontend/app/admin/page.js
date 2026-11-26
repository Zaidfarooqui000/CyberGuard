'use client';

// Admin overview: system-wide statistics and charts.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ScanLine, Link2, Mail, ShieldAlert, TriangleAlert, Activity, UserPlus, ArrowRight } from 'lucide-react';
import { PageHeader, StatCard, Spinner, Alert } from '@/components/ui';
import { RiskDoughnut, ActivityLine, RiskComparisonBar } from '@/components/Charts';
import { api } from '@/lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!stats) return <Spinner label="Loading statistics…" />;

  const { url, email } = stats;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="System-wide security statistics and activity.">
        <Link href="/admin/logs" className="btn-secondary"><Activity className="h-4 w-4" /> Activity logs</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Users" value={stats.users.total} icon={Users} accent="cyan" hint={`${stats.users.admins} admin(s)`} />
        <StatCard label="Total URL Scans" value={url.total} icon={Link2} accent="blue" />
        <StatCard label="Total Email Scans" value={email.total} icon={Mail} accent="purple" />
        <StatCard label="Threats Detected" value={stats.threats} icon={ShieldAlert} accent="red" hint="Suspicious + high risk" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="High-Risk Detections" value={url['HIGH RISK'] + email['HIGH RISK']} icon={ShieldAlert} accent="red" hint={`${url['HIGH RISK']} URL · ${email['HIGH RISK']} email`} />
        <StatCard label="Suspicious Detections" value={url.SUSPICIOUS + email.SUSPICIOUS} icon={TriangleAlert} accent="yellow" hint={`${url.SUSPICIOUS} URL · ${email.SUSPICIOUS} email`} />
        <StatCard label="New Users (7 days)" value={stats.users.newThisWeek} icon={UserPlus} accent="green" />
        <StatCard label="Activity Today" value={stats.activityToday} icon={Activity} accent="cyan" hint="Log entries" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold text-white">Scans per day (last 14 days)</h2>
          <ActivityLine daily={stats.daily} />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold text-white">Overall risk distribution</h2>
          <RiskDoughnut
            safe={url.SAFE + email.SAFE}
            suspicious={url.SUSPICIOUS + email.SUSPICIOUS}
            high={url['HIGH RISK'] + email['HIGH RISK']}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold text-white">URL vs email scan results</h2>
          <RiskComparisonBar url={url} email={email} />
        </div>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Most active users</h2>
            <Link href="/admin/users" className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300">All <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ul className="space-y-3">
            {stats.topUsers.map((u, i) => (
              <li key={u.id} className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-800 text-sm font-semibold text-cyan-300">{i + 1}</span>
                <span className="flex-1 truncate text-slate-200">{u.name}</span>
                <span className="flex items-center gap-1 text-sm text-slate-400"><ScanLine className="h-4 w-4" /> {u.scans}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
