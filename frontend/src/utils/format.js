const nf = new Intl.NumberFormat('en-US');

export const formatNumber = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : nf.format(Number(n));

export const formatPercent = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? '—'
    : `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

// Salary values from the backend are USD. period: 'yr' | 'hr'
export function formatUSD(value, period = 'yr') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: period === 'hr' ? 2 : 0,
    minimumFractionDigits: period === 'hr' ? 2 : 0,
  }).format(Number(value));
}

export const truncate = (text, max = 24) => {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'U';

// The jobs endpoint returns "" for missing values and the dataset uses "Not Disclosed".
export const hasSalary = (salary) => {
  const s = String(salary ?? '').trim();
  return s !== '' && s.toLowerCase() !== 'not disclosed';
};

export const orDash = (value) => {
  const s = String(value ?? '').trim();
  return s === '' ? '—' : s;
};

export const toChartData = (obj = {}) => Object.entries(obj).map(([name, value]) => ({ name, value }));
