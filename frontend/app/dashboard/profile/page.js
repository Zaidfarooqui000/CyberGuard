'use client';

// Profile management: update name/email and change password.
import { useState } from 'react';
import { Save, KeyRound, LoaderCircle, User } from 'lucide-react';
import { PageHeader, Alert } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    if (profile.name.trim().length < 2) return setProfileMsg({ type: 'error', text: 'Name must be at least 2 characters.' });
    setSavingProfile(true);
    try {
      const data = await api('/auth/profile', { method: 'PUT', body: { name: profile.name.trim(), email: profile.email.trim() } });
      setUser(data.user);
      setProfile({ name: data.user.name, email: data.user.email });
      setProfileMsg({ type: 'success', text: data.message });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pw.newPassword !== pw.confirm) return setPwMsg({ type: 'error', text: 'New passwords do not match.' });
    setSavingPw(true);
    try {
      const data = await api('/auth/password', { method: 'PUT', body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ type: 'success', text: data.message });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your account details and password." />

      <div className="card mb-6 flex items-center gap-4 animate-fade-up">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          <p className="mt-1 text-xs text-slate-500">
            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 capitalize text-cyan-300">{user.role}</span> · Member since {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4" noValidate>
          <h2 className="flex items-center gap-2 font-semibold text-white"><User className="h-5 w-5 text-cyan-400" /> Account details</h2>
          <Alert type={profileMsg.type}>{profileMsg.text}</Alert>
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} maxLength={100} />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </form>

        <form onSubmit={savePassword} className="card space-y-4" noValidate>
          <h2 className="flex items-center gap-2 font-semibold text-white"><KeyRound className="h-5 w-5 text-cyan-400" /> Change password</h2>
          <Alert type={pwMsg.type}>{pwMsg.text}</Alert>
          <div>
            <label htmlFor="current" className="label">Current password</label>
            <input id="current" type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div>
            <label htmlFor="new" className="label">New password</label>
            <input id="new" type="password" autoComplete="new-password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} maxLength={72} />
            <p className="mt-1 text-xs text-slate-500">8+ characters with uppercase, lowercase and a number.</p>
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirm new password</label>
            <input id="confirm" type="password" autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} maxLength={72} />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPw}>
            {savingPw ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update password
          </button>
        </form>
      </div>
    </>
  );
}
