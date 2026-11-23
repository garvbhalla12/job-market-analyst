import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, GRID, PALETTE } from './palette';
import ChartTooltip from './ChartTooltip';
import { formatNumber, truncate } from '../../utils/format';

// Vertical bar chart. data: [{ name, value, percentage? }]
export default function VBarChart({
  data,
  height = 300,
  valueLabel = 'Jobs',
  formatValue = formatNumber,
  labelMax = 12,
  angle = -30,
  colors = PALETTE,
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: angle ? 36 : 8, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="name"
            interval={0}
            angle={angle}
            textAnchor={angle ? 'end' : 'middle'}
            height={angle ? 64 : 30}
            tick={{ fill: '#cbd5e1', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => truncate(v, labelMax)}
          />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={formatValue} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip valueLabel={valueLabel} formatValue={formatValue} />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
