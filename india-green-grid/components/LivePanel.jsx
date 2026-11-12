'use client';

import { useEffect, useState } from 'react';
import { SOURCE } from '@/lib/palette';
import { int, one } from '@/lib/format';

// Order matters: neighbouring colours in this order stay distinguishable.
const SEGMENTS = [
  { key: 'hydro', label: 'Large hydro', color: SOURCE.hydro.color, fossil: false },
  { key: 'thermal', label: 'Coal & lignite', color: SOURCE.coal.color, fossil: true },
  { key: 'otherRes', label: 'Other renewables', color: SOURCE.otherRes.color, fossil: false },
  { key: 'renewable', label: 'Solar & wind', color: SOURCE.solar.color, fossil: false },
  { key: 'nuclear', label: 'Nuclear', color: SOURCE.nuclear.color, fossil: false },
  { key: 'gas', label: 'Gas', color: SOURCE.gas.color, fossil: true }
];

const timeIST = iso =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

function ShareBar({ label, value, note }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-ink-2">{label}</p>
        <p className="text-2xl font-light text-ink">{value == null ? '–' : `${one(value)}%`}</p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-ink/70 transition-[width] duration-700" style={{ width: `${value ?? 0}%` }} />
      </div>
      {note && <p className="mt-1.5 text-xs text-ink-3">{note}</p>}
    </div>
  );
}

export default function LivePanel({ capacityNonFossilShare, capacityAsOf }) {
  const [live, setLive] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetch('/api/live', { cache: 'no-store' }).then(r => r.json());
        if (!cancelled) setLive(data);
      } catch {
        if (!cancelled) setLive(prev => prev ?? { ok: false, error: 'Network error' });
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const mw = live?.ok ? live.mw : null;
  const total = mw ? SEGMENTS.reduce((sum, s) => sum + (mw[s.key] || 0), 0) + (mw.storage || 0) : 0;
  const fossil = mw ? SEGMENTS.filter(s => s.fossil).reduce((sum, s) => sum + (mw[s.key] || 0), 0) : 0;
  const nonFossilNow = mw ? 100 * (1 - fossil / total) : null;
  const focus = hover && mw ? SEGMENTS.find(s => s.key === hover) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            {mw && !live.stale ? <span className="live-dot" aria-hidden="true" /> : null}
            <span className="font-medium text-ink">
              {live == null ? 'Connecting to MERIT India…' : mw ? (live.stale ? 'Last good reading' : 'Live') : 'Live feed unavailable'}
            </span>
            {mw && <span className="text-ink-3">read at {timeIST(live.readAt)} IST</span>}
          </div>
          <a href="https://meritindia.in/" target="_blank" rel="noreferrer" className="text-xs text-ink-3 underline-offset-4 hover:text-ink hover:underline">
            Source: MERIT India, Ministry of Power
          </a>
        </div>

        {live != null && !mw && (
          <p className="mt-6 text-ink-2">
            The Ministry of Power portal did not respond, so no live reading is shown. The capacity and generation figures
            below come from published CEA reports and are unaffected.
          </p>
        )}

        {mw && (
          <>
            <p className="mt-6 text-sm text-ink-3">Demand being met across India</p>
            <p className="text-5xl font-light tracking-tight text-ink md:text-6xl">
              {one(mw.demandMet / 1000)}
              <span className="ml-2 text-xl text-ink-3">GW</span>
            </p>

            <div className="mt-6 flex h-9 w-full gap-[2px]" role="img" aria-label="Share of current generation by source" onMouseLeave={() => setHover(null)}>
              {SEGMENTS.map((s, i) => {
                const share = (100 * (mw[s.key] || 0)) / total;
                if (share < 0.3) return null;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onMouseEnter={() => setHover(s.key)}
                    onFocus={() => setHover(s.key)}
                    onBlur={() => setHover(null)}
                    aria-label={`${s.label}: ${int(mw[s.key])} MW, ${one(share)}%`}
                    className={`h-full min-w-[3px] transition-opacity ${i === 0 ? 'rounded-l-md' : ''} ${
                      hover && hover !== s.key ? 'opacity-45' : ''
                    } last:rounded-r-md`}
                    style={{ width: `${share}%`, background: s.color }}
                  />
                );
              })}
            </div>
            <p className="mt-2 h-5 text-sm text-ink-2" aria-live="polite">
              {focus
                ? `${focus.label}: ${int(mw[focus.key])} MW · ${one((100 * mw[focus.key]) / total)}% of generation`
                : 'Hover a segment for its exact reading.'}
            </p>

            <ul className="tabular mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              {SEGMENTS.map(s => (
                <li
                  key={s.key}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                  className="flex items-center gap-2.5 border-b border-line py-1.5"
                >
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
                  <span className="flex-1 text-ink-2">{s.label}</span>
                  <span className="text-ink">{int(mw[s.key] || 0)} MW</span>
                  <span className="w-12 text-right text-ink-3">{one((100 * (mw[s.key] || 0)) / total)}%</span>
                </li>
              ))}
            </ul>
            {mw.storage > 0 && (
              <p className="mt-2 text-xs text-ink-3">Plus {int(mw.storage)} MW from pumped storage and batteries.</p>
            )}
          </>
        )}
      </div>

      <div className="card flex flex-col justify-between gap-6 p-6">
        <div>
          <p className="eyebrow">The gap</p>
          <h3 className="mt-2 text-2xl font-light leading-snug text-ink">
            Clean capacity is built. Clean power depends on the hour.
          </h3>
        </div>
        <div className="space-y-6">
          <ShareBar
            label="Non-fossil share of installed capacity"
            value={capacityNonFossilShare}
            note={`CEA installed capacity report, as of ${capacityAsOf}`}
          />
          <ShareBar
            label="Non-fossil share of power right now"
            value={nonFossilNow}
            note={mw ? `MERIT India, ${timeIST(live.readAt)} IST. Falls sharply after sunset.` : 'Waiting for a live reading.'}
          />
        </div>
      </div>
    </div>
  );
}
