'use client';

// Email Phishing Detection page
import { useState } from 'react';
import { Mail, LoaderCircle, Search, Info, Eraser } from 'lucide-react';
import { PageHeader, Alert } from '@/components/ui';
import ScanResult from '@/components/ScanResult';
import { api } from '@/lib/api';

const samples = {
  phishing: {
    sender: 'PayPal Security <service@paypa1-support.com>',
    subject: 'URGENT: Your account has been suspended',
    content:
      'Dear Customer,\n\nWe detected unusual activity on your account. Your account will be suspended within 24 hours unless you verify your account immediately.\n\nClick the link below and enter your password and credit card number to restore access:\nhttp://paypa1-secure.com/login/verify\n\nFailure to comply will result in legal action!!!\n\nPayPal Security Team',
  },
  lottery: {
    sender: 'Claims Office <claims.dept2291@gmail.com>',
    subject: 'CONGRATULATIONS WINNER',
    content:
      'CONGRATULATIONS!!! You have won the international lottery of 2 million dollars. To claim your prize send your bank account details and pay the processing fee of 50 USD. Reply within 48 hours.',
  },
  safe: {
    sender: 'ali@university.edu.pk',
    subject: 'Meeting notes',
    content:
      'Hi Sara,\n\nAttached are the meeting notes from Tuesday. Let me know if anything is missing. The project review is next week in room 204.\n\nThanks,\nAli',
  },
};

const MAX = 20000;

export default function ScanEmailPage() {
  const [form, setForm] = useState({ sender: '', subject: '', content: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.content.trim().length < 10) return setError('Please paste the email content (at least 10 characters).');
    if (form.content.length > MAX) return setError(`Email content is too long (max ${MAX} characters).`);

    setLoading(true);
    setResult(null);
    try {
      const data = await api('/scans/email', { method: 'POST', body: form });
      // Keep the original text in the browser only (for this report view / PDF). It is not stored on the server.
      setResult({ ...data, originalContent: (form.subject ? `Subject: ${form.subject}\n` : '') + form.content });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Email Phishing Scanner" subtitle="Paste a suspicious email to check it for phishing and scam indicators." />

      <form onSubmit={handleSubmit} className="card no-print space-y-4 animate-fade-up">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="sender" className="label">Sender <span className="text-slate-500">(optional)</span></label>
            <input id="sender" className="input text-sm" placeholder='e.g. "PayPal <service@paypa1.com>"' value={form.sender} onChange={update('sender')} maxLength={320} />
          </div>
          <div>
            <label htmlFor="subject" className="label">Subject <span className="text-slate-500">(optional)</span></label>
            <input id="subject" className="input text-sm" placeholder="Email subject line" value={form.subject} onChange={update('subject')} maxLength={300} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="content" className="label">Email content</label>
            <span className={`text-xs ${form.content.length > MAX ? 'text-red-400' : 'text-slate-500'}`}>
              {form.content.length.toLocaleString()} / {MAX.toLocaleString()}
            </span>
          </div>
          <textarea
            id="content"
            className="input min-h-56 resize-y text-sm leading-relaxed"
            placeholder="Paste the full email text here…"
            value={form.content}
            onChange={update('content')}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Load sample:</span>
            <button type="button" onClick={() => setForm(samples.phishing)} className="rounded-md border border-red-500/40 px-2 py-1 text-red-300 hover:bg-red-500/10">Account phishing</button>
            <button type="button" onClick={() => setForm(samples.lottery)} className="rounded-md border border-yellow-500/40 px-2 py-1 text-yellow-300 hover:bg-yellow-500/10">Lottery scam</button>
            <button type="button" onClick={() => setForm(samples.safe)} className="rounded-md border border-green-500/40 px-2 py-1 text-green-300 hover:bg-green-500/10">Normal email</button>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => { setForm({ sender: '', subject: '', content: '' }); setResult(null); setError(''); }}>
              <Eraser className="h-4 w-4" /> Clear
            </button>
            <button type="submit" className="btn-primary px-6" disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Analyzing…' : 'Analyze Email'}
            </button>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Privacy: the full email text is analyzed in memory and NOT saved. Only the result and a short redacted excerpt are
          stored in your history. Never paste real passwords – remove them before scanning.
        </p>
      </form>

      <div className="mt-6 space-y-4">
        <Alert>{error}</Alert>
        {result && <ScanResult report={result} showReportLink />}
      </div>
    </>
  );
}
