'use client';

// Chart.js wrappers styled for the dark CyberGuard theme.
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.12)';
ChartJS.defaults.font.family = 'Inter, "Segoe UI", system-ui, sans-serif';

const RISK_COLORS = ['#22c55e', '#eab308', '#ef4444'];

const tooltip = {
  backgroundColor: '#0f1d33',
  borderColor: '#1f3a66',
  borderWidth: 1,
  padding: 10,
  titleColor: '#e2e8f0',
  bodyColor: '#cbd5e1',
};

// Safe / Suspicious / High risk distribution
export function RiskDoughnut({ safe = 0, suspicious = 0, high = 0 }) {
  const total = safe + suspicious + high;
  const data = {
    labels: ['Safe', 'Suspicious', 'High risk'],
    datasets: [
      {
        data: total ? [safe, suspicious, high] : [1, 0, 0],
        backgroundColor: total ? RISK_COLORS : ['#1f3a66'],
        borderColor: '#08111f',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };
  return (
    <div className="relative mx-auto h-60 max-w-xs">
      <Doughnut
        data={data}
        options={{
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
            tooltip: { ...tooltip, enabled: total > 0 },
          },
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
        <p className="text-3xl font-bold text-white">{total}</p>
        <p className="text-xs text-slate-400">scans</p>
      </div>
    </div>
  );
}

// Scans per day (URL vs email)
export function ActivityLine({ daily = [] }) {
  const labels = daily.map((d) => new Date(d.day + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const data = {
    labels,
    datasets: [
      {
        label: 'URL scans',
        data: daily.map((d) => d.url),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Email scans',
        data: daily.map((d) => d.email),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  };
  return (
    <div className="h-64">
      <Line
        data={data}
        options={{
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
          plugins: { legend: { labels: { usePointStyle: true } }, tooltip },
        }}
      />
    </div>
  );
}

// URL vs Email results side by side
export function RiskComparisonBar({ url, email }) {
  const data = {
    labels: ['Safe', 'Suspicious', 'High risk'],
    datasets: [
      {
        label: 'URL scans',
        data: [url.SAFE, url.SUSPICIOUS, url['HIGH RISK']],
        backgroundColor: '#22d3ee',
        borderRadius: 6,
      },
      {
        label: 'Email scans',
        data: [email.SAFE, email.SUSPICIOUS, email['HIGH RISK']],
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };
  return (
    <div className="h-64">
      <Bar
        data={data}
        options={{
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
          plugins: { legend: { labels: { usePointStyle: true } }, tooltip },
        }}
      />
    </div>
  );
}
