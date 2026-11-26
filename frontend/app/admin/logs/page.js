'use client';

// Admin: system activity logs (logins, scans, admin actions...).
import { useEffect, useState } from 'react';
import { Search, Activity, RefreshCw } from 'lucide-react';
import { PageHeader, Spinner, Alert, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

function activityColor(text) {
  const t = text.toLowerCase();
  if (t.includes('failed') || t.includes('high risk') || t.includes('deleted user')) return 'bg-red-400';
  if (t.includes('suspicious') || t.includes('deleted') || t.includes('role')) return 'bg-yellow-400';
  if (t.includes('safe') || t.includes('logged in') || t.includes('registered')) return 'bg-green-400';
  return 'bg-cyan-400';
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = (q = query) => {
    setError('');
    api(`/admin/logs${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then((data) => setLogs(data.logs))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search.trim());
    setLogs(null);
    load(search.trim());
  };

  return (
    <>
      <PageHeader title="Activity Logs" subtitle="Security-relevant events across the system (latest 300).">
        <button onClick={() => { setLogs(null); load(); }} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </PageHeader>

      <form onSubmit={handleSearch} className="card mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10" placeholder="Search activity, user name or email…" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      <Alert>{error}</Alert>
      {!logs && !error && <Spinner />}
      {logs && logs.length === 0 && <EmptyState icon={Activity} title="No activity found" />}
      {logs && logs.length > 0 && (
        <div className="table-wrap animate-fade-up">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-slate-400">{formatDate(l.created_at)}</td>
                  <td>
                    {l.user_id ? (
                      <>
                        <p className="text-sm">{l.user_name || `User #${l.user_id}`}</p>
                        <p className="text-xs text-slate-500">{l.user_email}</p>
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">Anonymous / deleted</span>
                    )}
                  </td>
                  <td>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${activityColor(l.activity)}`} />
                      {l.activity}
                    </span>
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
