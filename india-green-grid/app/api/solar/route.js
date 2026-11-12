import { NextResponse } from 'next/server';
import { STATES, estimateSolar, ASSUMPTIONS } from '@/lib/solar';

// GET /api/solar?state=Karnataka[&monthlyUnits=300&tariff=7&costPerKw=55000]
// Looks up long-term average sunshine for the state capital from NASA POWER
// and, when monthlyUnits is given, returns a rooftop system estimate.
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const state = STATES.find(s => s.name.toLowerCase() === (params.get('state') || '').toLowerCase());
  if (!state) return NextResponse.json({ error: 'Unknown state', states: STATES.map(s => s.name) }, { status: 400 });

  const url =
    'https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE' +
    `&longitude=${state.lon}&latitude=${state.lat}&format=JSON`;
  let irradiance;
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`NASA POWER responded ${res.status}`);
    const monthly = (await res.json())?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    if (!monthly || !(monthly.ANN > 0)) throw new Error('No irradiance value returned');
    irradiance = { annual: monthly.ANN, monthly, unit: 'kWh per m² per day' };
  } catch (err) {
    return NextResponse.json({ error: `Sunshine data unavailable: ${err.message}` }, { status: 502 });
  }

  const monthlyUnits = Number(params.get('monthlyUnits'));
  const estimate = monthlyUnits
    ? estimateSolar({
        monthlyUnits,
        tariff: Number(params.get('tariff')) || ASSUMPTIONS.tariff,
        costPerKw: Number(params.get('costPerKw')) || ASSUMPTIONS.costPerKw,
        irradiance: irradiance.annual,
        special: !!state.special
      })
    : undefined;

  return NextResponse.json({
    state: state.name,
    location: { city: state.city, lat: state.lat, lon: state.lon },
    specialCategory: !!state.special,
    irradiance,
    estimate,
    assumptions: ASSUMPTIONS,
    source: { name: 'NASA POWER climatology (2001-2025 average)', url: 'https://power.larc.nasa.gov/' }
  });
}
