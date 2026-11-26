'use client';

// Admin: manage user accounts (change role, delete).
import { useEffect, useState } from 'react';
import { Trash2, Search, Users } from 'lucide-react';
import { PageHeader, Spinner, Alert, EmptyState } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () =>
    api('/admin/users')
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (u, role) => {
    if (!window.confirm(`Change ${u.name}'s role to ${role}?`)) return;
    setError('');
    try {
      const data = await api(`/admin/users/${u.id}/role`, { method: 'PUT', body: { role } });
      setMessage(data.message);
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? All of their scans will also be deleted.`)) return;
    setError('');
    try {
      const data = await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      setMessage(data.message);
      setUsers((list) => list.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = (users || []).filter((u) =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="User Management" subtitle="View registered users, change roles and remove accounts." />

      <div className="card mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10" placeholder="Search by name, email or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {users && <span className="text-sm text-slate-500">{filtered.length} of {users.length} users</span>}
      </div>

      <div className="mb-3 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{message}</Alert>
      </div>

      {!users && !error && <Spinner />}
      {users && filtered.length === 0 && <EmptyState icon={Users} title="No users found" />}
      {users && filtered.length > 0 && (
        <div className="table-wrap animate-fade-up">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>URL scans</th>
                <th>Email scans</th>
                <th>Registered</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-500/15 font-semibold text-cyan-300">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{u.name} {isMe && <span className="text-xs text-cyan-400">(you)</span>}</p>
                          <p className="truncate text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="rounded-lg border border-navy-600 bg-navy-850 px-2 py-1 text-sm disabled:opacity-50"
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => changeRole(u, e.target.value)}
                        aria-label={`Role for ${u.name}`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{u.url_scans}</td>
                    <td>{u.email_scans}</td>
                    <td className="whitespace-nowrap text-slate-400">{formatDate(u.created_at)}</td>
                    <td className="text-right">
                      <button onClick={() => deleteUser(u)} disabled={isMe} className="btn-danger px-3 py-1.5" title="Delete user">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
