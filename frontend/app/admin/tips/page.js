'use client';

// Admin: manage educational content (security tips) – create, edit, delete.
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Lightbulb, LoaderCircle } from 'lucide-react';
import { PageHeader, Spinner, Alert, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

const emptyForm = { title: '', description: '' };

export default function AdminTipsPage() {
  const [tips, setTips] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () =>
    api('/tips', { auth: false })
      .then((data) => setTips(data.tips))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (form.title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (form.description.trim().length < 10) return setError('Description must be at least 10 characters.');
    setSaving(true);
    try {
      const body = { title: form.title.trim(), description: form.description.trim() };
      const data = editingId
        ? await api(`/admin/tips/${editingId}`, { method: 'PUT', body })
        : await api('/admin/tips', { method: 'POST', body });
      setMessage(data.message);
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tip) => {
    setEditingId(tip.id);
    setForm({ title: tip.title, description: tip.description });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (tip) => {
    if (!window.confirm(`Delete the tip "${tip.title}"?`)) return;
    try {
      const data = await api(`/admin/tips/${tip.id}`, { method: 'DELETE' });
      setMessage(data.message);
      setTips((list) => list.filter((t) => t.id !== tip.id));
      if (editingId === tip.id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Security Tips" subtitle="Manage the educational tips shown on the Awareness page." />

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4 animate-fade-up" noValidate>
        <h2 className="flex items-center gap-2 font-semibold text-white">
          {editingId ? <Pencil className="h-5 w-5 text-cyan-400" /> : <Plus className="h-5 w-5 text-cyan-400" />}
          {editingId ? `Edit tip #${editingId}` : 'Add a new tip'}
        </h2>
        <Alert>{error}</Alert>
        <Alert type="success">{message}</Alert>
        <div>
          <label htmlFor="title" className="label">Title</label>
          <input id="title" className="input" maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Enable two-factor authentication" />
        </div>
        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" className="input min-h-28" maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explain the tip in simple language…" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? 'Update tip' : 'Publish tip'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              <X className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </form>

      {!tips && !error && <Spinner />}
      {tips && tips.length === 0 && <EmptyState icon={Lightbulb} title="No tips yet" text="Add your first security tip above." />}
      {tips && tips.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {tips.map((tip) => (
            <div key={tip.id} className={`card flex flex-col ${editingId === tip.id ? 'border-cyan-500/50' : ''}`}>
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{tip.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-400">{tip.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-navy-700 pt-3">
                <span className="text-xs text-slate-500">{formatDate(tip.created_at)}</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(tip)} className="btn-secondary px-3 py-1.5" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(tip)} className="btn-danger px-3 py-1.5" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
