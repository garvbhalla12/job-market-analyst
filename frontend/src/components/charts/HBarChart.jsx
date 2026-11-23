import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, GRID, PALETTE } from './palette';
import ChartTooltip from './ChartTooltip';
import { formatNumber, truncate } from '../../utils/format';

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
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatValue} />
          <YAxis
            type="category"
            dataKey="name"
            width={labelWidth}
            interval={0}
            tick={{ fill: '#cbd5e1', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => truncate(v, Math.max(12, Math.floor(labelWidth / 6.2)))}
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
