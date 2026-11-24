import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, GRID, PALETTE } from './palette';
import ChartTooltip from './ChartTooltip';
import { formatNumber, truncate } from '../../utils/format';
import useElementWidth from '../../hooks/useElementWidth';

// Horizontal bar chart (bars grow left to right). data: [{ name, value, percentage? }]
export default function HBarChart({
  data,
  height = 320,
  labelWidth = 130,
  valueLabel = 'Jobs',
  formatValue = formatNumber,
  gradient = true,
  color = PALETTE[0],
}) {
  // On narrow screens, labels may use at most ~36% of the chart so the bars stay readable.
  const [ref, width] = useElementWidth();
  const narrow = width > 0 && width < 420;
  const fontSize = narrow ? 10 : 11;
  const effectiveLabelWidth = width > 0 ? Math.min(labelWidth, Math.max(76, Math.round(width * 0.36))) : labelWidth;
  const labelChars = Math.max(10, Math.floor(effectiveLabelWidth / (fontSize * 0.56)));

  return (
    <div ref={ref} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: narrow ? 8 : 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={{ fill: AXIS, fontSize }} axisLine={false} tickLine={false} tickFormatter={formatValue} />
          <YAxis
            type="category"
            dataKey="name"
            width={effectiveLabelWidth}
            interval={0}
            tick={{ fill: '#cbd5e1', fontSize }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => truncate(v, labelChars)}
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip valueLabel={valueLabel} formatValue={formatValue} />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={gradient ? PALETTE[i % PALETTE.length] : color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
