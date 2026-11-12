import { PageHeader } from '@/components/ui';
import SolarCalculator from '@/components/SolarCalculator';

export const metadata = { title: 'Solar calculator · India Green Grid' };

export default function SolarPage() {
  return (
    <>
      <PageHeader
        eyebrow="For homes and small businesses"
        title="What would rooftop solar do for your bill?"
        intro="Pick your state and enter your monthly units. You get a system size, the central subsidy, your payback period and the CO₂ you would avoid."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SolarCalculator />
      </div>
    </>
  );
}
