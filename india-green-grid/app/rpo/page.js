import { PageHeader } from '@/components/ui';
import RpoTracker from '@/components/RpoTracker';

export const metadata = { title: 'RPO tracker · India Green Grid' };

export default function RpoPage() {
  return (
    <>
      <PageHeader
        eyebrow="For DISCOMs and industries"
        title="Are you meeting your renewable purchase obligation?"
        intro="Enter two numbers. The tracker compares your renewable share with the national target for the year and tells you the shortfall in million units."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <RpoTracker />
      </div>
    </>
  );
}
