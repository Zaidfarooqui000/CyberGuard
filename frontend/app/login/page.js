'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoaderCircle, LogIn } from 'lucide-react';
import AuthCard from '@/components/AuthCard';
import { Alert } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';

// Sample accounts created by backend/database/sample_data.sql
const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@cyberguard.com', password: 'Admin@123' },
  { role: 'User', email: 'ali@student.com', password: 'User@1234' },
];

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Go to the dashboard.
  useEffect(() => {
    if (!loading && user) router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Please enter your email and password.');
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      // Only allow redirects to our own pages
      const next = new URLSearchParams(window.location.search).get('next');
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
      router.push(safeNext || (loggedIn.role === 'admin' ? '/admin' : '/dashboard'));
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to scan URLs and emails and view your history.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        No account yet?{' '}
        <Link href="/register" className="font-medium text-cyan-400 hover:text-cyan-300">Create one</Link>
      </p>

      {/* Demo accounts – click a row to fill in the login form */}
      <div className="mt-6 overflow-hidden rounded-xl border border-navy-700 text-xs">
        <p className="bg-navy-800 px-3 py-2 font-semibold text-slate-300">Demo accounts (click to fill)</p>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500">
              <th className="px-3 py-1.5 font-medium">Role</th>
              <th className="px-3 py-1.5 font-medium">Email</th>
              <th className="px-3 py-1.5 font-medium">Password</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ACCOUNTS.map((acc) => (
              <tr
                key={acc.email}
                onClick={() => setForm({ email: acc.email, password: acc.password })}
                className="cursor-pointer border-t border-navy-700 text-slate-300 transition hover:bg-navy-800"
                title={`Fill in the ${acc.role} login`}
              >
                <td className="px-3 py-2 font-semibold text-cyan-300">{acc.role}</td>
                <td className="px-3 py-2 font-mono">{acc.email}</td>
                <td className="px-3 py-2 font-mono">{acc.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuthCard>
  );
}
