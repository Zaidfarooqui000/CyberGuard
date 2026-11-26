'use client';

// Displays a full scan result / security report.
// Used right after a scan and on the saved report page.
import Link from 'next/link';
import { CircleCheck, TriangleAlert, Info, Download, Printer, FileText, ShieldCheck, Link2, Mail } from 'lucide-react';
import { RiskBadge } from './ui';
import { RISK_STYLES, SEVERITY_STYLES, formatDate } from '@/lib/format';
import { downloadReportPdf } from '@/lib/pdf';

// Circular score meter (0–100)
export function RiskGauge({ score, level }) {
  const color = (RISK_STYLES[level] || {}).hex || '#22d3ee';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="#16294a" strokeWidth="12" fill="none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/ 100 risk</span>
      </div>
    </div>
  );
}

export default function ScanResult({ report, showReportLink = false }) {
  if (!report) return null;
  const isUrl = report.type === 'url';
  const style = RISK_STYLES[report.riskLevel] || RISK_STYLES.SAFE;
  const triggered = (report.indicators || []).filter((i) => i.points > 0);
  const infos = (report.indicators || []).filter((i) => i.points === 0);
  const submitted = isUrl
    ? report.submittedUrl
    : report.originalContent || (report.meta && report.meta.excerpt) || 'Email content (not stored for privacy)';

  return (
    <div className="print-area space-y-5 animate-fade-up">
      {/* Summary */}
      <div className={`card border ${style.border}`}>
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
          <RiskGauge score={report.riskScore} level={report.riskLevel} />
          <div className="min-w-0 flex-1 space-y-3 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <RiskBadge level={report.riskLevel} size="lg" />
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                {isUrl ? <Link2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {isUrl ? 'URL analysis' : 'Email analysis'}
              </span>
            </div>
            <p className="text-lg text-slate-100">{report.summary}</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-slate-500">{isUrl ? 'Submitted URL' : 'Submitted email'}</dt>
                {/* Shown as plain text – never as a clickable link */}
                <dd className="break-all font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-32 overflow-y-auto">{submitted}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Scan date & time</dt>
                <dd className="text-slate-200">{formatDate(report.scannedAt)}</dd>
              </div>
              {isUrl && report.registeredDomain && (
                <div>
                  <dt className="text-slate-500">Registered domain</dt>
                  <dd className="font-mono text-slate-200">{report.registeredDomain}</dd>
                </div>
              )}
              {!isUrl && report.meta?.senderDomain && (
                <div>
                  <dt className="text-slate-500">Sender domain</dt>
                  <dd className="font-mono text-slate-200">{report.meta.senderDomain}</dd>
                </div>
              )}
              {report.userName && (
                <div>
                  <dt className="text-slate-500">Scanned by</dt>
                  <dd className="text-slate-200">{report.userName}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <div className="no-print mt-5 flex flex-wrap justify-center gap-2 border-t border-navy-700 pt-4 md:justify-end">
          {showReportLink && report.id && (
            <Link href={`/dashboard/report/${report.type}/${report.id}`} className="btn-secondary">
              <FileText className="h-4 w-4" /> Open full report
            </Link>
          )}
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button onClick={() => downloadReportPdf(report)} className="btn-primary">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Indicators */}
        <div className="card lg:col-span-3">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <TriangleAlert className="h-5 w-5 text-yellow-400" /> Detected security indicators ({triggered.length})
          </h3>
          {triggered.length === 0 && (
            <p className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-300">
              No detection rules were triggered.
            </p>
          )}
          <ul className="space-y-3">
            {triggered.map((ind, idx) => (
              <li key={ind.id + idx} className="rounded-xl border border-navy-700 bg-navy-850 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-100">{ind.title}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[ind.severity]}`}>
                    +{ind.points} pts · {ind.severity}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-400">{ind.description}</p>
                {ind.matches && ind.matches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ind.matches.slice(0, 10).map((m) => (
                      <span key={m} className="max-w-full break-all rounded-md bg-navy-700 px-2 py-0.5 font-mono text-xs text-cyan-200">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
            {infos.map((ind) => (
              <li key={ind.id} className="flex gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <div>
                  <p className="font-medium text-cyan-200">{ind.title}</p>
                  <p className="text-slate-400">{ind.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Checks performed */}
        <div className="card lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <ShieldCheck className="h-5 w-5 text-cyan-400" /> Checks performed
          </h3>
          <ul className="space-y-2">
            {(report.checks || []).map((c) => (
              <li key={c.name} className="flex items-start gap-3 rounded-lg px-2 py-1.5">
                {c.passed ? (
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                ) : (
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">{c.name}</p>
                  <p className="break-words text-xs text-slate-500">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Links found in an email */}
      {!isUrl && report.links && report.links.length > 0 && (
        <div className="card">
          <h3 className="mb-3 font-semibold text-white">Links found in the email (not opened)</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {report.links.map((l) => (
                  <tr key={l.url}>
                    <td className="break-all font-mono text-xs">{l.url}</td>
                    <td>{l.riskScore ?? '—'}</td>
                    <td>{l.riskLevel === 'INVALID' ? <span className="text-xs text-slate-400">Invalid URL</span> : <RiskBadge level={l.riskLevel} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="card">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <CircleCheck className="h-5 w-5 text-green-400" /> Recommended actions
        </h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300 marker:text-cyan-400">
          {(report.recommendations || []).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </div>

      <p className="rounded-xl border border-navy-700 bg-navy-900 p-4 text-xs text-slate-400">
        <strong className="text-slate-300">{report.method}</strong> {report.disclaimer}
      </p>
    </div>
  );
}
