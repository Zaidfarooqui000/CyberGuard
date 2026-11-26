// Display helpers shared by many pages.

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Tailwind classes + colours for each risk level
export const RISK_STYLES = {
  SAFE: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    hex: '#22c55e',
    label: 'SAFE',
  },
  SUSPICIOUS: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/40',
    hex: '#eab308',
    label: 'SUSPICIOUS',
  },
  'HIGH RISK': {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    hex: '#ef4444',
    label: 'HIGH RISK',
  },
};

export const SEVERITY_STYLES = {
  high: 'text-red-300 bg-red-500/10 border-red-500/40',
  medium: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/40',
  low: 'text-blue-300 bg-blue-500/10 border-blue-500/40',
  info: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/40',
};

export function truncate(text, max = 60) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}
