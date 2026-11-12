// Live all-India power position from MERIT India (Ministry of Power).
// The portal publishes the current reading on its home page; we read it at most
// once every five minutes and keep the last good reading if the portal is down.
const MERIT_URL = 'https://meritindia.in/';
const SOURCE = { name: 'MERIT India, Ministry of Power', url: MERIT_URL };

const FIELDS = [
  ['demandMet', /DEMAND\W*MET\W+([\d,]+)\W+MW/i],
  ['thermal', /THERMAL\W+GENERATION\W+([\d,]+)\W+MW/i],
  ['gas', /GAS\W+GENERATION\W+([\d,]+)\W+MW/i],
  ['nuclear', /NUCLEAR\W+GENERATION\W+([\d,]+)\W+MW/i],
  ['hydro', /HYDRO\W+GENERATION\W+([\d,]+)\W+MW/i],
  ['renewable', /RENEWABLE\W+GENERATION\W+([\d,]+)\W+MW/i],
  ['storage', /STORAGE\W+GENERATION\W+([\d,]+)\W+MW/i],
  ['otherRes', /OTHER\W+GENERATION\W+([\d,]+)\W+MW/i]
];
const REQUIRED = ['demandMet', 'thermal', 'gas', 'nuclear', 'hydro', 'renewable'];

let lastGood = null;

export function parseMerit(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' | ')
    .replace(/&nbsp;/g, ' ');
  const out = {};
  for (const [key, re] of FIELDS) {
    const m = text.match(re);
    if (m) out[key] = Number(m[1].replace(/,/g, ''));
  }
  // Reject a partial or implausible page rather than show wrong numbers.
  if (!REQUIRED.every(k => Number.isFinite(out[k]))) return null;
  if (out.demandMet < 50000 || out.demandMet > 500000) return null;
  return out;
}

export async function getLive() {
  try {
    const res = await fetch(MERIT_URL, {
      headers: { 'User-Agent': 'IndiaGreenGrid-student-project/0.1' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`MERIT responded ${res.status}`);
    const mw = parseMerit(await res.text());
    if (!mw) throw new Error('MERIT page layout not recognised');
    const date = res.headers.get('date');
    lastGood = {
      ok: true,
      stale: false,
      unit: 'MW',
      mw,
      readAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      source: SOURCE
    };
    return lastGood;
  } catch (err) {
    const error = String(err?.message || err);
    if (lastGood) return { ...lastGood, stale: true, error };
    return { ok: false, error, source: SOURCE };
  }
}
