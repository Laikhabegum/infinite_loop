import { NextResponse } from 'next/server';
import { getProvenance, getValidation } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET /api/sources - where every dataset came from, and the validation results.
export async function GET() {
  return NextResponse.json({ provenance: getProvenance(), validation: getValidation() });
}
