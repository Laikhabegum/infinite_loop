import { NextResponse } from 'next/server';
import { RPO_TRAJECTORY, rpoCompliance } from '@/lib/rpo';

// GET /api/rpo                                   -> the target trajectory
// GET /api/rpo?fy=2026-27&consumptionMU=1200&renewableMU=380 -> compliance result
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  if (!params.get('fy')) return NextResponse.json({ trajectory: RPO_TRAJECTORY, unit: '% of consumption' });
  const result = rpoCompliance({
    fy: params.get('fy'),
    consumptionMU: Number(params.get('consumptionMU')),
    renewableMU: Number(params.get('renewableMU'))
  });
  if (!result) {
    return NextResponse.json(
      { error: 'Provide fy (e.g. 2026-27), consumptionMU > 0 and renewableMU >= 0', years: RPO_TRAJECTORY.map(r => r.fy) },
      { status: 400 }
    );
  }
  return NextResponse.json(result);
}
