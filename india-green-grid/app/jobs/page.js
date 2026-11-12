import { PageHeader } from '@/components/ui';
import JobsBoard from '@/components/JobsBoard';
import { getJobs } from '@/lib/data';

export const metadata = { title: 'Green jobs · India Green Grid' };

export default function JobsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For job seekers"
        title="Work that builds the green grid"
        intro="Roles across solar, wind, storage, bioenergy, energy efficiency and the circular economy, searchable by skill and state."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <JobsBoard data={getJobs()} />
      </div>
    </>
  );
}
