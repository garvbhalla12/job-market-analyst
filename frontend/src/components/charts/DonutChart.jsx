import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PALETTE } from './palette';
import ChartTooltip from './ChartTooltip';
import { formatNumber, formatPercent } from '../../utils/format';
import useElementWidth from '../../hooks/useElementWidth';

// Donut (innerRadius > 0) or pie (innerRadius = 0). data: [{ name, value, percentage? }]
export default function DonutChart({ data, height = 240, innerRadius = 62, centerLabel, centerValue }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Put the legend beside the chart only when the CARD is wide enough
  // (a narrow card on a wide screen used to push the legend outside the card).
  const [ref, width] = useElementWidth();
  const sideBySide = width >= height + 240;

  return (
    <div ref={ref} className={`flex gap-4 ${sideBySide ? 'flex-row items-center' : 'flex-col items-center'}`}>
      <div style={{ height, width: '100%', maxWidth: height + 20 }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {innerRadius > 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-white">{centerValue ?? formatNumber(total)}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-400">{centerLabel ?? 'Total'}</span>
          </div>
        )}
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate text-slate-300">{d.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-400">
              {formatNumber(d.value)}
              <span className="ml-2 text-slate-500">
                {formatPercent(d.percentage ?? (total ? (d.value / total) * 100 : 0))}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
