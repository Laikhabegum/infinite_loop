'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { GEN_SERIES, INK, SOURCE, STACK_ORDER } from '@/lib/palette';
import { one } from '@/lib/format';

const SURFACE = '#0c1311';
const tick = { fill: INK.muted, fontSize: 12 };

function Tip({ active, payload, label, unit, showTotal }) {
  if (!active || !payload?.length) return null;
  const rows = [...payload].reverse();
  const total = rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);
  return (
    <div className="rounded-xl border border-line bg-[#0c1311f2] px-3 py-2.5 text-sm shadow-2xl">
      <p className="mb-1.5 font-medium text-ink">{label}</p>
      <ul className="tabular space-y-1">
        {rows.map(row => (
          <li key={row.dataKey} className="flex items-center gap-2 text-ink-2">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: row.color }} />
            <span className="flex-1">{row.name}</span>
            <span className="pl-4 text-ink">
              {one(row.value)} {unit}
            </span>
          </li>
        ))}
        {showTotal && rows.length > 1 && (
          <li className="flex justify-between border-t border-line pt-1 text-ink">
            <span>Total</span>
            <span>
              {one(total)} {unit}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

// Installed capacity by source over time, stacked, in GW.
export function CapacityTrend({ data }) {
  return (
    <div className="h-80 w-full" role="img" aria-label="Stacked area chart of installed capacity by source over the last year">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: INK.axis }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={64} tickFormatter={v => `${v} GW`} />
          <Tooltip content={<Tip unit="GW" showTotal />} cursor={{ stroke: INK.muted, strokeWidth: 1 }} />
          {STACK_ORDER.map(key => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={SOURCE[key].label}
              stackId="capacity"
              fill={SOURCE[key].color}
              fillOpacity={1}
              stroke={SURFACE}
              strokeWidth={2}
              color={SOURCE[key].color}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Daily generation from conventional sources, stacked, in MU.
export function DailyGeneration({ data }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Stacked bar chart of daily generation from thermal, hydro and nuclear plants">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: INK.axis }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={52} tickFormatter={v => v.toLocaleString('en-IN')} />
          <Tooltip content={<Tip unit="MU" showTotal />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          {GEN_SERIES.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="gen"
              fill={s.color}
              stroke={SURFACE}
              strokeWidth={1}
              radius={i === GEN_SERIES.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// RPO target trajectory with the user's achieved share as a reference line.
export function RpoTrajectory({ rows, achieved, selectedFy }) {
  const max = Math.max(50, Math.ceil(((achieved || 0) + 5) / 10) * 10);
  return (
    <div className="h-72 w-full" role="img" aria-label="Line chart of the RPO target for each financial year">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="fy" tick={tick} tickLine={false} axisLine={{ stroke: INK.axis }} />
          <YAxis domain={[0, max]} tick={tick} tickLine={false} axisLine={false} width={44} unit="%" />
          <Tooltip content={<Tip unit="%" />} cursor={{ stroke: INK.muted, strokeWidth: 1 }} />
          {Number.isFinite(achieved) && (
            <ReferenceLine
              y={Math.min(achieved, max)}
              stroke={INK.secondary}
              strokeDasharray="5 5"
              label={{ value: `You: ${one(achieved)}%`, position: 'insideTopLeft', fill: INK.primary, fontSize: 12 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="target"
            name="RPO target"
            stroke={SOURCE.hydro.color}
            strokeWidth={2}
            isAnimationActive={false}
            dot={({ cx, cy, payload }) => (
              <circle
                key={payload.fy}
                cx={cx}
                cy={cy}
                r={payload.fy === selectedFy ? 6 : 4}
                fill={SOURCE.hydro.color}
                stroke={SURFACE}
                strokeWidth={2}
              />
            )}
            activeDot={{ r: 6, stroke: SURFACE, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
