'use client';

// URL Phishing Detection page
import { useState } from 'react';
import { Link2, LoaderCircle, Search, Info } from 'lucide-react';
import { PageHeader, Alert } from '@/components/ui';
import ScanResult from '@/components/ScanResult';
import { api } from '@/lib/api';

const examples = [
  'https://www.google.com',
  'http://paypa1.com/login/verify',
  'https://bit.ly/3xYz12',
  'http://192.168.10.5/account/update.php',
  'https://accounts.google.com.security-check.top/signin',
];

export default function ScanUrlPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const value = url.trim();
    if (!value) return setError('Please enter a URL to analyze.');
    if (value.length > 2048) return setError('URL is too long (max 2048 characters).');

    setLoading(true);
    setResult(null);
    try {
      const data = await api('/scans/url', { method: 'POST', body: { url: value } });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="URL Phishing Scanner" subtitle="Check a website link for phishing indicators before you open it." />

      <form onSubmit={handleSubmit} className="card no-print animate-fade-up">
        <label htmlFor="url" className="label">Website URL</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="url"
              className="input pl-10 font-mono text-sm"
              placeholder="https://example.com/login"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={2048}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" className="btn-primary px-6" disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Analyzing…' : 'Analyze URL'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Try an example:</span>
          {examples.map((ex) => (
            <button
              type="button"
              key={ex}
              onClick={() => setUrl(ex)}
              className="max-w-full truncate rounded-md border border-navy-600 bg-navy-850 px-2 py-1 font-mono text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
            >
              {ex}
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          CyberGuard only analyzes the text of the URL. The link is never opened, visited, or executed.
        </p>
      </form>

      <div className="mt-6 space-y-4">
        <Alert>{error}</Alert>
        {result && <ScanResult report={result} showReportLink />}
      </div>
    </>
  );
}
