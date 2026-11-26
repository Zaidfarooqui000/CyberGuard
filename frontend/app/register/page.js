'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoaderCircle, UserPlus, CircleCheck, Circle } from 'lucide-react';
import AuthCard from '@/components/AuthCard';
import { Alert } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';

// Same rules as the backend validation
const passwordRules = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /\d/.test(p), label: 'A number' },
];

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (!passwordRules.every((r) => r.test(form.password))) return setError('Your password does not meet all requirements.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Start analyzing suspicious links and emails for free.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" className="input" autoComplete="name" placeholder="Ali Khan" value={form.name} onChange={update('name')} maxLength={100} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update('email')} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" className="input" autoComplete="new-password" value={form.password} onChange={update('password')} maxLength={72} />
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {passwordRules.map((r) => {
              const ok = r.test(form.password);
              return (
                <li key={r.label} className={`flex items-center gap-1.5 ${ok ? 'text-green-400' : 'text-slate-500'}`}>
                  {ok ? <CircleCheck className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} {r.label}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input id="confirm" type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} maxLength={72} />
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">Log in</Link>
      </p>
    </AuthCard>
  );
}
