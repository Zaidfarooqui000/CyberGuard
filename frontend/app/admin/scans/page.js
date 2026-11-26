'use client';

// Admin: every URL and email scan in the system.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, ScanLine } from 'lucide-react';
import { PageHeader, Spinner, Alert, RiskBadge, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, truncate } from '@/lib/format';

export default function AdminScansPage() {
  const [type, setType] = useState('url');
  const [level, setLevel] = useState('');
  const [scans, setScans] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setScans(null);
    setError('');
    const params = new URLSearchParams({ type });
    if (level) params.set('level', level);
    api(`/admin/scans?${params}`)
      .then((data) => setScans(data.scans))
      .catch((err) => setError(err.message));
  }, [type, level]);

  return (
    <>
      <PageHeader title="All Scans" subtitle="Monitor URL and email scans from all users, including suspicious and high-risk detections." />

      <div className="card mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border border-navy-600 bg-navy-850 p-1">
          {[['url', 'URL scans'], ['email', 'Email scans']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg px-4 py-1.5 text-sm transition ${type === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select className="input sm:w-56" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by risk level">
          <option value="">All risk levels</option>
          <option value="SAFE">Safe</option>
          <option value="SUSPICIOUS">Suspicious</option>
          <option value="HIGH RISK">High risk</option>
        </select>
        {scans && <span className="text-sm text-slate-500 sm:ml-auto">{scans.length} scan(s)</span>}
      </div>

      <Alert>{error}</Alert>
      {!scans && !error && <Spinner />}
      {scans && scans.length === 0 && <EmptyState icon={ScanLine} title="No scans match this filter" />}
      {scans && scans.length > 0 && (
        <div className="table-wrap animate-fade-up">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{type === 'url' ? 'URL' : 'Email excerpt'}</th>
                <th>User</th>
                <th>Score</th>
                <th>Risk level</th>
                <th>Scanned</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s.id}>
                  <td className="text-slate-500">#{s.id}</td>
                  <td className="max-w-xs"><span className="block truncate font-mono text-xs" title={s.target}>{truncate(s.target, 70)}</span></td>
                  <td>
                    <p className="text-sm">{s.user_name}</p>
                    <p className="text-xs text-slate-500">{s.user_email}</p>
                  </td>
                  <td className="font-semibold">{s.risk_score}</td>
                  <td><RiskBadge level={s.risk_level} /></td>
                  <td className="whitespace-nowrap text-slate-400">{formatDate(s.scanned_at)}</td>
                  <td className="text-right">
                    <Link href={`/dashboard/report/${type}/${s.id}`} className="btn-secondary px-3 py-1.5" title="View report">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
