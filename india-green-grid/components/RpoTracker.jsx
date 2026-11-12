'use client';

import { useState } from 'react';
import { RPO_TRAJECTORY, rpoCompliance } from '@/lib/rpo';
import { int, one } from '@/lib/format';
import { RpoTrajectory } from './charts';
import { DataTable, SourceNote } from './ui';

// Indian financial year runs April to March.
const currentFy = () => {
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fy = `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
  return RPO_TRAJECTORY.some(r => r.fy === fy) ? fy : RPO_TRAJECTORY[RPO_TRAJECTORY.length - 1].fy;
};

function Gauge({ achieved, target }) {
  // Half-ring: the arc fills to the achieved share; the tick marks the target.
  const scaleMax = Math.max(60, Math.ceil((achieved + 5) / 10) * 10);
  const r = 90;
  const length = Math.PI * r;
  const frac = v => Math.min(1, Math.max(0, v / scaleMax));
  const angle = Math.PI * (1 - frac(target));
  const tx = 110 + Math.cos(angle) * r;
  const ty = 110 - Math.sin(angle) * r;
  const met = achieved >= target;
  return (
    <svg viewBox="0 0 220 128" className="mx-auto w-full max-w-xs" role="img" aria-label={`Achieved ${one(achieved)} percent against a target of ${one(target)} percent`}>
      <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M20 110 A90 90 0 0 1 200 110"
        fill="none"
        stroke={met ? '#0ca30c' : '#fab219'}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${length * frac(achieved)} ${length}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <line
        x1={110 + Math.cos(angle) * (r - 13)}
        y1={110 - Math.sin(angle) * (r - 13)}
        x2={110 + Math.cos(angle) * (r + 13)}
        y2={110 - Math.sin(angle) * (r + 13)}
        stroke="#f0efec"
        strokeWidth="2.5"
      />
      <text x={tx} y={ty - 18} textAnchor="middle" fontSize="10" fill="#c3c2b7">
        target {target}%
      </text>
      <text x="110" y="98" textAnchor="middle" fontSize="34" fontWeight="300" fill="#f0efec">
        {one(achieved)}%
      </text>
      <text x="110" y="118" textAnchor="middle" fontSize="11" fill="#898781">
        renewable share achieved
      </text>
    </svg>
  );
}

export default function RpoTracker() {
  const [fy, setFy] = useState(currentFy);
  const [consumption, setConsumption] = useState('1200');
  const [renewable, setRenewable] = useState('380');

  const consumptionMU = Number(consumption);
  const renewableMU = Number(renewable);
  const tooMuch = renewableMU > consumptionMU && consumptionMU > 0;
  const result = tooMuch ? null : rpoCompliance({ fy, consumptionMU, renewableMU });
  const finalYear = RPO_TRAJECTORY[RPO_TRAJECTORY.length - 1];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
      <form className="card space-y-5 p-6" onSubmit={e => e.preventDefault()}>
        <h2 className="text-lg font-medium text-ink">Your numbers</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-2">Financial year</span>
          <select className="field" value={fy} onChange={e => setFy(e.target.value)}>
            {RPO_TRAJECTORY.map(r => (
              <option key={r.fy} value={r.fy}>
                {r.fy} (target {r.target}%)
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-2">Total electricity consumption (MU)</span>
          <input className="field tabular" type="number" min="0" step="any" inputMode="decimal" value={consumption} onChange={e => setConsumption(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-2">Renewable energy procured (MU)</span>
          <input className="field tabular" type="number" min="0" step="any" inputMode="decimal" value={renewable} onChange={e => setRenewable(e.target.value)} />
        </label>
        <p className="text-xs leading-relaxed text-ink-3">
          1 MU = 1 million units (kWh). Include renewable power bought directly, generated on-site, and renewable energy
          certificates you hold for the year.
        </p>
      </form>

      <div className="card p-6">
        {!result ? (
          <p className="text-ink-2">
            {tooMuch
              ? 'Renewable energy procured is larger than total consumption. Check the two figures.'
              : 'Enter your total consumption and renewable procurement to see your compliance.'}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  result.compliant ? 'bg-good/15 text-[#5fd45f]' : 'bg-warning/15 text-warning'
                }`}
              >
                <span aria-hidden="true">{result.compliant ? '✓' : '!'}</span>
                {result.compliant ? 'Target met' : 'Shortfall'}
              </span>
              <span className="text-sm text-ink-3">FY {result.fy}</span>
            </div>
            <Gauge achieved={result.achieved} target={result.target} />
            <dl className="tabular mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-ink-3">Compliance</dt>
                <dd className="text-3xl font-light text-ink">{one(result.compliance)}%</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-3">Renewable needed</dt>
                <dd className="text-3xl font-light text-ink">
                  {int(result.requiredMU)} <span className="text-sm text-ink-3">MU</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-3">{result.compliant ? 'Surplus' : 'Shortfall'}</dt>
                <dd className="text-3xl font-light text-ink">
                  {int(result.compliant ? result.surplusMU : result.shortfallMU)} <span className="text-sm text-ink-3">MU</span>
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-sm text-ink-2">
              {result.compliant
                ? `You are ${int(result.surplusMU)} MU above this year's requirement.`
                : `Procure ${int(result.shortfallMU)} MU more renewable energy this year to meet the ${result.target}% target.`}{' '}
              At today&apos;s consumption, the {finalYear.fy} target of {finalYear.target}% needs{' '}
              {int((finalYear.target / 100) * consumptionMU)} MU of renewable energy.
            </p>
          </>
        )}
      </div>

      <div className="card p-6 lg:col-span-2">
        <h2 className="text-lg font-medium text-ink">RPO target, {RPO_TRAJECTORY[0].fy} to {finalYear.fy} (% of consumption)</h2>
        <div className="mt-4">
          <RpoTrajectory rows={RPO_TRAJECTORY} achieved={result?.achieved} selectedFy={fy} />
        </div>
        <DataTable caption="RPO target by financial year" columns={['Financial year', 'Target']} rows={RPO_TRAJECTORY.map(r => [r.fy, `${r.target}%`])} />
        <SourceNote>
          Source: Ministry of Power RPO notification of 20 October 2023. A Renewable Consumption Obligation (RCO) notification
          issued in 2025 supersedes this framework; confirm current obligations against the gazette text before a real filing.
          State regulators may also set their own trajectories.
        </SourceNote>
      </div>
    </div>
  );
}
