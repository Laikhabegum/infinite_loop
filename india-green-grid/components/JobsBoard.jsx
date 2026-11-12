'use client';

import { useMemo, useState } from 'react';

export default function JobsBoard({ data }) {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('All sectors');
  const sectors = useMemo(() => ['All sectors', ...new Set(data.listings.map(job => job.sector))], [data]);
  const q = query.trim().toLowerCase();
  const jobs = data.listings.filter(
    job =>
      (sector === 'All sectors' || job.sector === sector) &&
      (!q || [job.title, job.sector, job.location, ...job.skills].join(' ').toLowerCase().includes(q))
  );

  return (
    <div className="space-y-5">
      <div className="card flex items-start gap-3 border-warning/30 p-4 text-sm">
        <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-warning/20 text-xs font-bold text-warning">
          !
        </span>
        <p className="text-ink-2">
          <span className="font-medium text-ink">Sample listings.</span> {data.notice}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <label>
          <span className="sr-only">Search jobs</span>
          <input className="field" type="search" placeholder="Search by role, skill or state" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <label>
          <span className="sr-only">Sector</span>
          <select className="field" value={sector} onChange={e => setSector(e.target.value)}>
            {sectors.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-ink-3" aria-live="polite">
        {jobs.length} of {data.listings.length} roles
      </p>

      {jobs.length === 0 ? (
        <div className="card p-8 text-center text-ink-2">
          No roles match that search.{' '}
          <button
            type="button"
            className="text-accent underline underline-offset-4"
            onClick={() => {
              setQuery('');
              setSector('All sectors');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {jobs.map(job => (
            <li key={job.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-medium text-ink">{job.title}</h2>
                <span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-3">Sample</span>
              </div>
              <p className="mt-1 text-sm text-ink-2">
                {job.sector} · {job.location} · {job.level} · {job.type}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.map(skill => (
                  <li key={skill} className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-ink-2">
                    {skill}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-medium text-ink">Find real openings</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {data.portals.map(portal => (
            <li key={portal.url}>
              <a href={portal.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-line p-4 transition-colors hover:border-white/30">
                <span className="font-medium text-ink">{portal.name} ↗</span>
                <span className="mt-1 block text-sm text-ink-3">{portal.by}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
