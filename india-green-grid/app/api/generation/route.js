import { NextResponse } from 'next/server';
import { getGeneration } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET /api/generation - daily generation (MU) for thermal, nuclear and large hydro.
export async function GET() {
  return NextResponse.json(getGeneration());
}
