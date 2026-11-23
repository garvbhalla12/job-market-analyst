import { formatNumber, formatPercent } from '../../utils/format';

// Generic dark tooltip. Reads optional `percentage` from the data row.
export default function ChartTooltip({ active, payload, label, valueLabel = 'Jobs', formatValue = formatNumber }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-medium text-slate-100">{row.name ?? label}</p>
      <p className="text-slate-300">
        {valueLabel}: <span className="font-semibold text-white">{formatValue(payload[0].value)}</span>
      </p>
      {row.percentage !== undefined && row.percentage !== null && (
        <p className="text-slate-400">{formatPercent(row.percentage)} of postings</p>
      )}
    </div>
  );
}
