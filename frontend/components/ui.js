// Small reusable UI pieces: page header, stat card, risk badge, alerts, spinner, empty state.
import { LoaderCircle, TriangleAlert, CircleCheck } from 'lucide-react';
import { RISK_STYLES } from '@/lib/format';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="no-print flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const ACCENTS = {
  cyan: 'from-cyan-500/20 text-cyan-300 ring-cyan-500/30',
  blue: 'from-blue-500/20 text-blue-300 ring-blue-500/30',
  green: 'from-green-500/20 text-green-300 ring-green-500/30',
  yellow: 'from-yellow-500/20 text-yellow-300 ring-yellow-500/30',
  red: 'from-red-500/20 text-red-300 ring-red-500/30',
  purple: 'from-purple-500/20 text-purple-300 ring-purple-500/30',
};

export function StatCard({ label, value, icon: Icon, accent = 'cyan', hint }) {
  return (
    <div className="card group relative overflow-hidden transition hover:-translate-y-0.5 hover:border-cyan-500/40 animate-fade-up">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${ACCENTS[accent]} to-transparent opacity-60 blur-xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ring-1 ${ACCENTS[accent]} to-navy-800`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

export function RiskBadge({ level, size = 'sm' }) {
  const style = RISK_STYLES[level] || { text: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/40' };
  const sizes = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold ${style.text} ${style.bg} ${style.border} ${sizes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const styles =
    type === 'success'
      ? 'border-green-500/40 bg-green-500/10 text-green-300'
      : 'border-red-500/40 bg-red-500/10 text-red-300';
  const Icon = type === 'success' ? CircleCheck : TriangleAlert;
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${styles}`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <LoaderCircle className="h-6 w-6 animate-spin text-cyan-400" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-navy-600 px-6 py-14 text-center">
      {Icon && <Icon className="h-10 w-10 text-slate-600" />}
      <p className="font-semibold text-slate-200">{title}</p>
      {text && <p className="max-w-sm text-sm text-slate-400">{text}</p>}
      {children}
    </div>
  );
}
