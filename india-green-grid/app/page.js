import Link from 'next/link';
import { getCapacity, getGeneration } from '@/lib/data';
import { gw, int, longDate, monthLabel, one, pct } from '@/lib/format';
import { GEN_SERIES, SOURCE, STACK_ORDER } from '@/lib/palette';
import { DataTable, Legend, Section, SourceNote, Stat } from '@/components/ui';
import { CapacityTrend, DailyGeneration } from '@/components/charts';
import LivePanel from '@/components/LivePanel';

export const dynamic = 'force-dynamic';

const TOOLS = [
  { href: '/rpo', title: 'RPO compliance tracker', text: 'For DISCOMs and industries: enter consumption and renewable purchases, get your compliance and shortfall.' },
  { href: '/solar', title: 'Rooftop solar calculator', text: 'For homes and small businesses: system size, subsidy, payback period and CO₂ avoided for your state.' },
  { href: '/jobs', title: 'Green jobs board', text: 'For job seekers: roles across solar, wind, storage, bioenergy and the circular economy.' }
];

export default function Home() {
  const capacity = getCapacity();
  const generation = getGeneration();
  const all = capacity.allIndia;
  const res = capacity.resBreakup;
  const asOf = longDate(capacity.asOf);
  const nonFossil = all.hydro + all.res + all.nuclear;

  const trend = capacity.trend
    .filter(row => row.solar != null && row.wind != null)
    .map(row => ({
      label: monthLabel(row.month),
      hydro: row.hydro / 1000,
      coal: (row.coal + row.lignite) / 1000,
      otherRes: (row.res - row.solar - row.wind) / 1000,
      solar: row.solar / 1000,
      nuclear: row.nuclear / 1000,
      wind: row.wind / 1000,
      gas: (row.gas + row.diesel) / 1000
    }));
  const first = capacity.trend[0];
  const last = capacity.trend[capacity.trend.length - 1];
  const solarAdded = last.solar != null && first.solar != null ? last.solar - first.solar : null;

  const days = generation.days.map(day => ({
    label: new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    thermal: day.thermal.actualMU,
    hydro: day.hydro.actualMU,
    nuclear: day.nuclear.actualMU
  }));
  const latest = generation.latest;

  const states = [...capacity.states].sort((a, b) => b.res - a.res).slice(0, 12);
  const maxRes = states[0]?.res || 1;

  return (
    <>
      <section className="mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
        <p className="eyebrow rise">India Green Grid · decision support for the energy transition</p>
        <h1 className="hero-title rise mt-5 max-w-4xl pb-3 text-5xl sm:text-6xl md:text-8xl">
          India&apos;s energy transition, in real numbers.
        </h1>
        <p className="rise mt-6 max-w-2xl text-lg text-ink-2 md:text-xl">
          Official data from the Central Electricity Authority and the Ministry of Power, brought into one place for
          citizens, DISCOMs, financiers and policymakers.
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3">
          <a href="#live" className="btn btn-primary">
            See the live grid
          </a>
          <Link href="/rpo" className="btn btn-ghost">
            Check RPO compliance
          </Link>
          <Link href="/solar" className="btn btn-ghost">
            Size my rooftop solar
          </Link>
        </div>
        <dl className="rise mt-14 grid max-w-3xl grid-cols-1 gap-8 border-t border-line pt-8 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink-3">Installed capacity</dt>
            <dd className="mt-1 text-4xl font-light text-ink">
              {gw(all.total)} <span className="text-base text-ink-3">GW</span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-3">Non-fossil share of capacity</dt>
            <dd className="mt-1 text-4xl font-light text-ink">{pct(nonFossil, all.total)}%</dd>
          </div>
          {solarAdded != null && (
            <div>
              <dt className="text-sm text-ink-3">Solar added in 12 months</dt>
              <dd className="mt-1 text-4xl font-light text-ink">
                +{gw(solarAdded)} <span className="text-base text-ink-3">GW</span>
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-xs text-ink-3">CEA installed capacity report, as of {asOf}.</p>
      </section>

      <Section
        id="live"
        eyebrow="Right now"
        title="What is powering India this minute"
        intro="The Ministry of Power publishes the current all-India power position. This panel re-reads it every five minutes."
      >
        <LivePanel capacityNonFossilShare={(100 * nonFossil) / all.total} capacityAsOf={asOf} />
      </Section>

      <Section
        eyebrow="Installed capacity"
        title={`${gw(all.total)} GW of power plants, by source`}
        intro={`Position as of ${asOf}. Solar is the fastest-growing source; coal is still the largest single block.`}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Coal & lignite" value={gw(all.coal + all.lignite)} unit="GW" note={`${pct(all.coal + all.lignite, all.total)}% of all capacity`} />
          <Stat label="Solar" value={gw(res.solar)} unit="GW" note={`${pct(res.solar, all.total)}% of all capacity`} />
          <Stat label="Wind" value={gw(res.wind)} unit="GW" note={`${pct(res.wind, all.total)}% of all capacity`} />
          <Stat label="Large hydro & nuclear" value={gw(all.hydro + all.nuclear)} unit="GW" note={`${pct(all.hydro + all.nuclear, all.total)}% of all capacity`} />
        </div>

        <div className="card mt-5 p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <h3 className="text-lg font-medium text-ink">Capacity by source, last {trend.length} months</h3>
            <Legend items={STACK_ORDER.map(key => SOURCE[key])} />
          </div>
          <CapacityTrend data={trend} />
          <DataTable
            caption="Installed capacity by source in GW"
            columns={['Month', ...STACK_ORDER.map(key => SOURCE[key].label), 'Total']}
            rows={trend.map(row => [row.label, ...STACK_ORDER.map(key => one(row[key])), one(STACK_ORDER.reduce((s, key) => s + row[key], 0))])}
          />
          <SourceNote>
            Source: CEA monthly installed capacity reports via the National Power Portal. Bio, small hydro and waste is the
            rest of the renewable (RES) category after solar and wind.
          </SourceNote>
        </div>
      </Section>

      <Section
        eyebrow="Daily generation"
        title="Coal still does the heavy lifting"
        intro={`On ${longDate(latest.date)}, thermal plants generated ${int(latest.thermal.actualMU)} MU of the ${int(latest.total?.actualMU ?? 0)} MU from conventional sources.`}
      >
        <div className="card p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <h3 className="text-lg font-medium text-ink">Conventional generation per day, last {days.length} days (MU)</h3>
            <Legend items={GEN_SERIES} />
          </div>
          <DailyGeneration data={days} />
          <DataTable
            caption="Daily generation in million units"
            columns={['Date', 'Thermal', 'Large hydro', 'Nuclear']}
            rows={days.map(d => [d.label, one(d.thermal), one(d.hydro), one(d.nuclear)])}
          />
          <SourceNote>
            Source: CEA daily generation report (sub-report 1). 1 MU = 1 million units = 1 GWh. Covers stations above 25 MW
            and does not include solar, wind or other renewable generation, which CEA reports separately.
          </SourceNote>
        </div>
      </Section>

      <Section
        eyebrow="State view"
        title="Where the renewables are"
        intro="The twelve states with the most renewable capacity (solar, wind, bio and small hydro)."
      >
        <div className="card overflow-x-auto p-2 sm:p-4">
          <table className="tabular w-full min-w-[560px] text-left text-sm">
            <thead className="text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">State</th>
                <th scope="col" className="px-3 py-2 font-medium">Renewable capacity</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Renewable</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">All sources</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {states.map(s => (
                <tr key={s.state} className="border-t border-line">
                  <th scope="row" className="px-3 py-2.5 font-normal text-ink">{s.state}</th>
                  <td className="w-2/5 px-3 py-2.5">
                    <div className="h-2.5 rounded-r-[4px] bg-ink/65" style={{ width: `${Math.max(1, (100 * s.res) / maxRes)}%` }} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink">{gw(s.res)} GW</td>
                  <td className="px-3 py-2.5 text-right text-ink-2">{gw(s.total)} GW</td>
                  <td className="px-3 py-2.5 text-right text-ink-2">{pct(s.res, s.total)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNote>Source: CEA state-wise installed capacity reports, as of {asOf}. All {capacity.states.length} states and UTs are available from /api/capacity.</SourceNote>
      </Section>

      <Section eyebrow="Tools" title="Turn the data into a decision">
        <div className="grid gap-5 md:grid-cols-3">
          {TOOLS.map(tool => (
            <Link key={tool.href} href={tool.href} className="card group block p-6 transition-transform hover:-translate-y-1">
              <h3 className="text-xl font-medium text-ink">{tool.title}</h3>
              <p className="mt-2 text-ink-2">{tool.text}</p>
              <p className="mt-5 text-sm font-medium text-accent">
                Open <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
