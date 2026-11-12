import { NextResponse } from 'next/server';
import { getCapacity } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET /api/capacity - installed capacity (MW) by source, region, state and month.
export async function GET() {
  return NextResponse.json(getCapacity());
}
