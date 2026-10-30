import type { Route } from '@/lib/router';
import { PageLayout } from '@/components/layout/PageLayout';

export function AboutPage({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <PageLayout
      title="About Keep Me Online"
      description="A free, privacy-first power-cut backup planner."
      navigate={navigate}
    >
      <section>
        <h2 className="text-xl font-semibold text-navy-900">Purpose</h2>
        <p className="mt-2">
          Keep Me Online helps remote workers, students, and households estimate whether their battery backup can keep their internet and essential devices running during a power outage. The main question it answers: &ldquo;Will my router, laptop, and essentials last through this power cut?&rdquo;
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">The estimation model</h2>
        <p className="mt-2">
          The calculator uses a steady-average-load model. It takes your battery capacity, applies a usable-capacity fraction and an optional reserve, divides by the converted device load (including inverter losses and idle draw), and estimates runtime in hours. Scenario comparisons show what happens when you keep only essential devices or switch off nonessential ones.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Limitations</h2>
        <p className="mt-2">This simplified model does not account for:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Lead-acid discharge-rate effects (Peukert&rsquo;s law).</li>
          <li>Battery aging and capacity loss over time.</li>
          <li>Temperature effects on battery chemistry.</li>
          <li>Startup surges from motors, compressors, or power supplies.</li>
          <li>Dynamic laptop charging behavior.</li>
          <li>Automatic low-load shutdown on some inverters and UPS units.</li>
          <li>UPS-specific discharge curves and transfer behavior.</li>
        </ul>
        <p className="mt-3 text-sm text-navy-600">
          This tool does not assess wiring safety, battery compatibility, or medical-equipment backup requirements. Do not use it as the sole basis for critical power planning.
        </p>
      </section>
    </PageLayout>
  );
}
