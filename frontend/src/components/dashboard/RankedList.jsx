import { formatNumber, formatPercent } from '../../utils/format';

// Ranked rows with an inline share bar. rows: [{ name, count, percentage }]
export default function RankedList({ rows, countLabel = 'jobs', maxPercent }) {
  const max = maxPercent ?? Math.max(...rows.map((r) => r.percentage ?? 0), 1);
  return (
    <ol className="divide-y divide-white/[0.05]">
      {rows.map((row, i) => (
        <li key={`${row.name}-${i}`} className="flex items-center gap-4 py-3">
          <span className="w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-slate-500">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-slate-100">{row.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-slate-300">
                {formatNumber(row.count)} <span className="text-xs text-slate-500">{countLabel}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan"
                  style={{ width: `${Math.max(2, ((row.percentage ?? 0) / max) * 100)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-400">{formatPercent(row.percentage)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
