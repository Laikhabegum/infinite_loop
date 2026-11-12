'use client';

import { useEffect, useState } from 'react';
import { ASSUMPTIONS, STATES, estimateSolar } from '@/lib/solar';
import { int, one, rupees } from '@/lib/format';
import { SourceNote } from './ui';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function Result({ label, value, unit, note }) {
  return (
    <div className="border-t border-line pt-3">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-3xl font-light text-ink">
        {value}
        {unit && <span className="ml-1.5 text-sm text-ink-3">{unit}</span>}
      </dd>
      {note && <p className="mt-1 text-xs text-ink-3">{note}</p>}
    </div>
  );
}

export default function SolarCalculator() {
  const [stateName, setStateName] = useState('Karnataka');
  const [units, setUnits] = useState('300');
  const [tariff, setTariff] = useState(String(ASSUMPTIONS.tariff));
  const [cost, setCost] = useState(String(ASSUMPTIONS.costPerKw));
  const [sun, setSun] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setSun({ status: 'loading' });
    fetch(`/api/solar?state=${encodeURIComponent(stateName)}`)
      .then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Request failed');
        if (!cancelled) setSun({ status: 'ready', ...body });
      })
      .catch(err => {
        if (!cancelled) setSun({ status: 'error', message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [stateName]);

  const state = STATES.find(s => s.name === stateName);
  const estimate =
    sun.status === 'ready'
      ? estimateSolar({
          monthlyUnits: Number(units),
          tariff: Number(tariff),
          costPerKw: Number(cost),
          irradiance: sun.irradiance.annual,
          special: !!state?.special
        })
      : null;
  const monthly = sun.status === 'ready' ? MONTHS.map(m => ({ m, v: sun.irradiance.monthly[m] })) : [];
  const peak = Math.max(...monthly.map(x => x.v), 1);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
      <form className="card space-y-5 p-6" onSubmit={e => e.preventDefault()}>
        <h2 className="text-lg font-medium text-ink">Your home</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-2">State</span>
          <select className="field" value={stateName} onChange={e => setStateName(e.target.value)}>
            {STATES.map(s => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-2">Electricity used per month (units)</span>
          <input className="field tabular" type="number" min="1" step="any" inputMode="decimal" value={units} onChange={e => setUnits(e.target.value)} />
          <span className="mt-1 block text-xs text-ink-3">Printed on your bill as units or kWh.</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-2">Tariff (₹ per unit)</span>
            <input className="field tabular" type="number" min="0.1" step="any" inputMode="decimal" value={tariff} onChange={e => setTariff(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-2">Installed cost (₹ per kW)</span>
            <input className="field tabular" type="number" min="1" step="any" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} />
          </label>
        </div>

        {sun.status === 'ready' && (
          <div className="border-t border-line pt-4">
            <p className="text-sm text-ink-2">
              Sunshine in {sun.location.city}: <span className="text-ink">{one(sun.irradiance.annual)} kWh/m² per day</span> on average
            </p>
            <div className="mt-3 flex h-16 items-end gap-[3px]" role="img" aria-label="Average daily sunshine by month">
              {monthly.map(({ m, v }) => (
                <div key={m} className="group relative flex-1" title={`${m}: ${one(v)} kWh/m² per day`}>
                  <div className="rounded-t-[3px] bg-[#c98500] transition-opacity group-hover:opacity-80" style={{ height: `${(64 * v) / peak}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-ink-3">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </div>
        )}
      </form>

      <div className="card p-6">
        {sun.status === 'loading' && <p className="text-ink-2">Looking up sunshine data for {stateName}…</p>}
        {sun.status === 'error' && (
          <p className="text-ink-2">
            Could not get sunshine data for {stateName} ({sun.message}). Try again in a moment; no estimate is shown rather
            than a guess.
          </p>
        )}
        {sun.status === 'ready' && !estimate && <p className="text-ink-2">Enter your monthly units, tariff and cost to see an estimate.</p>}
        {estimate && (
          <>
            <p className="text-sm text-ink-3">Recommended system for {stateName}</p>
            <p className="mt-1 text-6xl font-light tracking-tight text-ink">
              {one(estimate.sizeKw)}
              <span className="ml-2 text-xl text-ink-3">kW</span>
            </p>
            <p className="mt-2 text-ink-2">
              Generates about {int(estimate.generation)} units a year and covers {int(estimate.billCovered)}% of your use.
            </p>
            <dl className="tabular mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Result label="System cost" value={rupees(estimate.grossCost)} />
              <Result
                label="Central subsidy"
                value={rupees(estimate.subsidy)}
                note={state?.special ? 'Higher rate for special-category states' : 'PM Surya Ghar: Muft Bijli Yojana'}
              />
              <Result label="You pay" value={rupees(estimate.netCost)} />
              <Result label="Savings per year" value={rupees(estimate.annualSavings)} />
              <Result label="Payback period" value={one(estimate.paybackYears)} unit="years" />
              <Result label="CO₂ avoided" value={one(estimate.co2TonnesPerYear)} unit="tonnes a year" />
            </dl>
          </>
        )}
        <details className="mt-6 text-sm">
          <summary className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink">
            <span aria-hidden="true">▸</span> How this is calculated
          </summary>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-2">
            <li>Yearly output per kW = average daily sunshine × 365 × {ASSUMPTIONS.performanceRatio} (real-world losses from heat, dust and the inverter).</li>
            <li>System size is your yearly use divided by that output, rounded to the nearest 0.5 kW, between 1 and {ASSUMPTIONS.maxKw} kW.</li>
            <li>Subsidy: ₹30,000 per kW for the first 2 kW, ₹18,000 for the third kW, capped at ₹78,000; 10% more in special-category states.</li>
            <li>Savings assume net metering, so every unit generated offsets a unit bought, up to your yearly use.</li>
            <li>CO₂ avoided uses the national grid average of {ASSUMPTIONS.gridEmissionFactor} kg per unit (CEA CO₂ Baseline Database).</li>
            <li>State top-up subsidies and DISCOM-specific net-metering rules are not included.</li>
          </ul>
        </details>
        <SourceNote>
          Sunshine: NASA POWER long-term average for the state capital. Subsidy: PM Surya Ghar scheme rules (pmsuryaghar.gov.in).
          Tariff and installed cost are starting values; replace them with your own bill and vendor quote.
        </SourceNote>
      </div>
    </div>
  );
}
