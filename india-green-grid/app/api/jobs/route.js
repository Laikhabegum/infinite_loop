import { NextResponse } from 'next/server';
import { getJobs } from '@/lib/data';

// GET /api/jobs[?q=solar&sector=Solar] - green job listings (sample data, see data/jobs.json).
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get('q') || '').toLowerCase();
  const sector = params.get('sector');
  const data = getJobs();
  const listings = data.listings.filter(
    job =>
      (!sector || job.sector === sector) &&
      (!q || [job.title, job.sector, job.location, ...job.skills].join(' ').toLowerCase().includes(q))
  );
  return NextResponse.json({ ...data, listings });
}
