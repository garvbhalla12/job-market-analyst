import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, GRID, PALETTE } from './palette';
import ChartTooltip from './ChartTooltip';
import { formatNumber, truncate } from '../../utils/format';
import useElementWidth from '../../hooks/useElementWidth';

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
  // On narrow screens: smaller text, shorter labels and steeper angle when there are many bars.
  const [ref, width] = useElementWidth();
  const narrow = width > 0 && width < 480;
  const crowded = narrow && data.length > 6;
  const fontSize = narrow ? 10 : 11;
  const effectiveAngle = crowded && angle ? -60 : angle;
  const effectiveLabelMax = narrow ? Math.min(labelMax, 9) : labelMax;

  return (
    <div ref={ref} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: narrow ? 4 : 8, bottom: effectiveAngle ? 36 : 8, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="name"
            interval={0}
            angle={effectiveAngle}
            textAnchor={effectiveAngle ? 'end' : 'middle'}
            height={effectiveAngle ? 64 : 30}
            tick={{ fill: '#cbd5e1', fontSize }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => truncate(v, effectiveLabelMax)}
          />
          <YAxis tick={{ fill: AXIS, fontSize }} axisLine={false} tickLine={false} width={narrow ? 40 : 48} tickFormatter={formatValue} />
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
