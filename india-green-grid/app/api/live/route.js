import { NextResponse } from 'next/server';
import { getLive } from '@/lib/live';

export const dynamic = 'force-dynamic';

// GET /api/live - current all-India power position in MW (MERIT India).
export async function GET() {
  const live = await getLive();
  return NextResponse.json(live, { status: live.ok ? 200 : 502 });
}
