'use client';

// Saved security report (printable / downloadable as PDF).
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader, Spinner, Alert } from '@/components/ui';
import ScanResult from '@/components/ScanResult';
import { api } from '@/lib/api';

export default function ReportPage() {
  const { type, id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!['url', 'email'].includes(type) || !/^\d+$/.test(String(id))) {
      setError('Invalid report address.');
      return;
    }
    api(`/history/${type}/${id}`)
      .then(setReport)
      .catch((err) => setError(err.message));
  }, [type, id]);

  return (
    <>
      <PageHeader title="Security Report" subtitle={`${type === 'url' ? 'URL' : 'Email'} scan #${id}`}>
        <button onClick={() => router.back()} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </PageHeader>
      <Alert>{error}</Alert>
      {!report && !error && <Spinner label="Loading report…" />}
      {report && <ScanResult report={report} />}
    </>
  );
}
