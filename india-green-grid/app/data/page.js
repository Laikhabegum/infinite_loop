import { PageHeader, Section } from '@/components/ui';
import { getProvenance, getValidation } from '@/lib/data';
import { longDate } from '@/lib/format';

export const metadata = { title: 'Data sources · India Green Grid' };
export const dynamic = 'force-dynamic';

const LIVE_SOURCES = [
  {
    dataset: 'Current all-India power position (MW by source)',
    publisher: 'MERIT India, Ministry of Power',
    url: 'https://meritindia.in/',
    frequency: 'Re-read every 5 minutes',
    format: 'Web page'
  },
  {
    dataset: 'Long-term average sunshine by location',
    publisher: 'NASA POWER climatology (2001-2025)',
    url: 'https://power.larc.nasa.gov/',
    frequency: 'On request, cached 30 days',
    format: 'JSON API'
  }
];

const ENDPOINTS = [
  ['/api/live', 'Current power position in MW by source'],
  ['/api/capacity', 'Installed capacity by source, region, state and month'],
  ['/api/generation', 'Daily conventional generation, last 30 days'],
  ['/api/rpo', 'RPO trajectory; add fy, consumptionMU and renewableMU for a compliance result'],
  ['/api/solar?state=Karnataka', 'Sunshine data and rooftop estimate for a state'],
  ['/api/jobs', 'Job listings (sample data); filter with q and sector'],
  ['/api/sources', 'This page as JSON: provenance log and validation results']
];

export default function DataPage() {
  const provenance = getProvenance();
  const validation = getValidation();
  const passed = validation.checks.filter(c => c.passed).length;

  return (
    <>
      <PageHeader
        eyebrow="Provenance and validation"
        title="Where every number comes from"
        intro="Each dataset is downloaded from an official publisher, parsed without filling in missing values, and checked against the totals printed in the source report."
      />

      <Section eyebrow="Published reports" title="Ingested datasets" intro={`Last pipeline run: ${longDate(provenance.generatedAt)}.`}>
        <div className="card overflow-x-auto p-2 sm:p-4">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Dataset</th>
                <th scope="col" className="px-3 py-2 font-medium">Publisher</th>
                <th scope="col" className="px-3 py-2 font-medium">Data as of</th>
                <th scope="col" className="px-3 py-2 font-medium">Updates</th>
                <th scope="col" className="px-3 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {provenance.sources.map(src => (
                <tr key={src.url} className="border-t border-line align-top">
                  <td className="px-3 py-2.5 text-ink">
                    {src.dataset}
                    {src.note && <span className="mt-0.5 block text-xs text-ink-3">{src.note}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">{src.publisher}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5 text-ink-2">{src.reportDate ? longDate(src.reportDate) : '–'}</td>
                  <td className="px-3 py-2.5 text-ink-2">{src.frequency}</td>
                  <td className="px-3 py-2.5">
                    <a href={src.url} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
                      {src.format} ↗
                    </a>
                  </td>
                </tr>
              ))}
              {LIVE_SOURCES.map(src => (
                <tr key={src.url} className="border-t border-line align-top">
                  <td className="px-3 py-2.5 text-ink">{src.dataset}</td>
                  <td className="px-3 py-2.5 text-ink-2">{src.publisher}</td>
                  <td className="px-3 py-2.5 text-ink-2">Live</td>
                  <td className="px-3 py-2.5 text-ink-2">{src.frequency}</td>
                  <td className="px-3 py-2.5">
                    <a href={src.url} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
                      {src.format} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        eyebrow="Validation report"
        title={`${passed} of ${validation.checks.length} checks passed`}
        intro="Parsed rows are summed and compared with the totals the publisher printed in the same report. A mismatch means the parser misread a table."
      >
        <div className="card overflow-x-auto p-2 sm:p-4">
          <table className="tabular w-full min-w-[640px] text-left text-sm">
            <thead className="text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Check</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Printed total</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Our sum</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Difference</th>
                <th scope="col" className="px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {validation.checks.map(check => (
                <tr key={check.check} className="border-t border-line">
                  <td className="px-3 py-2.5 text-ink">{check.check}</td>
                  <td className="px-3 py-2.5 text-right text-ink-2">{check.expected.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right text-ink-2">{check.actual.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right text-ink-2">{check.difference}</td>
                  <td className="px-3 py-2.5">
                    <span className={check.passed ? 'text-[#5fd45f]' : 'text-warning'}>
                      <span aria-hidden="true">{check.passed ? '✓' : '!'}</span> {check.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-ink-3">Differences of 0.01 MW come from rounding in the published reports.</p>
      </Section>

      <Section eyebrow="API" title="Use the data yourself" intro="Every module is served by a JSON endpoint.">
        <ul className="card divide-y divide-line">
          {ENDPOINTS.map(([path, text]) => (
            <li key={path} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-6">
              <a href={path} className="font-mono text-sm text-accent underline-offset-4 hover:underline sm:w-72 sm:shrink-0">
                GET {path}
              </a>
              <span className="text-sm text-ink-2">{text}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
