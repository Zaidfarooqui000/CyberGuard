'use client';

// Scan history: filter, view details, delete one, or clear all.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Eye, Trash2, Link2, Mail } from 'lucide-react';
import { PageHeader, Spinner, Alert, RiskBadge, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, truncate } from '@/lib/format';

export default function HistoryPage() {
  const [items, setItems] = useState(null);
  const [type, setType] = useState('all');
  const [level, setLevel] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setError('');
    const params = new URLSearchParams({ type });
    if (level) params.set('level', level);
    api(`/history?${params}`)
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message));
  }, [type, level]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this scan from your history?')) return;
    try {
      await api(`/history/${item.type}/${item.id}`, { method: 'DELETE' });
      setItems((list) => list.filter((i) => !(i.type === item.type && i.id === item.id)));
      setMessage('Scan deleted.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClear = async () => {
    const label = type === 'all' ? 'ALL your scans' : `all your ${type} scans`;
    if (!window.confirm(`Permanently delete ${label}? This cannot be undone.`)) return;
    try {
      const data = await api(`/history?type=${type}`, { method: 'DELETE' });
      setMessage(data.message);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Scan History" subtitle="Review, re-open or delete your previous scans.">
        <button className="btn-danger" onClick={handleClear} disabled={!items || items.length === 0}>
          <Trash2 className="h-4 w-4" /> Clear {type === 'all' ? 'history' : `${type} history`}
        </button>
      </PageHeader>

      <div className="card mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border border-navy-600 bg-navy-850 p-1">
          {['all', 'url', 'email'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg px-4 py-1.5 text-sm capitalize transition ${type === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
            >
              {t === 'all' ? 'All' : t === 'url' ? 'URLs' : 'Emails'}
            </button>
          ))}
        </div>
        <select className="input sm:w-56" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by risk level">
          <option value="">All risk levels</option>
          <option value="SAFE">Safe</option>
          <option value="SUSPICIOUS">Suspicious</option>
          <option value="HIGH RISK">High risk</option>
        </select>
        {items && <span className="text-sm text-slate-500 sm:ml-auto">{items.length} result(s)</span>}
      </div>

      <div className="space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{message}</Alert>
      </div>

      {!items && !error && <Spinner />}
      {items && items.length === 0 && (
        <EmptyState icon={History} title="No scans found" text="Scans you run will appear here.">
          <Link href="/dashboard/scan-url" className="btn-primary">Scan a URL</Link>
        </EmptyState>
      )}
      {items && items.length > 0 && (
        <div className="table-wrap mt-3 animate-fade-up">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Submitted content</th>
                <th>Score</th>
                <th>Risk level</th>
                <th>Scanned</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.type + item.id}>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase text-slate-400">
                      {item.type === 'url' ? <Link2 className="h-4 w-4 text-cyan-400" /> : <Mail className="h-4 w-4 text-blue-400" />}
                      {item.type}
                    </span>
                  </td>
                  <td className="max-w-xs">
                    <span className="block truncate font-mono text-xs" title={item.target}>{truncate(item.target, 80)}</span>
                  </td>
                  <td className="font-semibold">{item.risk_score}</td>
                  <td><RiskBadge level={item.risk_level} /></td>
                  <td className="whitespace-nowrap text-slate-400">{formatDate(item.scanned_at)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/report/${item.type}/${item.id}`} className="btn-secondary px-3 py-1.5" title="View report">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(item)} className="btn-danger px-3 py-1.5" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
