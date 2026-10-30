import type { ReactNode } from 'react';

interface ExplanationSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function ExplanationSection({ id, title, children }: ExplanationSectionProps) {
  return (
    <section id={id} className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h2 className="section-heading">{title}</h2>
      <div className="mt-3 space-y-3 text-navy-700 leading-relaxed">{children}</div>
    </section>
  );
}

export function ExplanatoryContent() {
  return (
    <div className="divide-y divide-navy-900/10">
      <ExplanationSection id="how-it-works" title="How this backup calculator works">
        <p>
          Keep Me Online takes your battery capacity, the devices you want to keep running, and a target outage duration, then estimates whether you have enough energy.
          It accounts for conversion losses between the battery and your devices, an optional inverter idle draw, and a planning reserve.
        </p>
        <p>
          The result is a planning estimate, not a guarantee. The model treats every device as drawing a steady average load. Real devices fluctuate, batteries age, and temperature matters.
        </p>
      </ExplanationSection>

      <ExplanationSection id="wh-vs-watts" title="Watt-hours versus watts">
        <p>
          Watts (W) measure how fast energy is used right now. Watt-hours (Wh) measure the total amount of energy stored. A 10 W router running for 5 hours consumes 50 Wh.
        </p>
        <p>
          Your battery is rated in Wh (or in volts and amp-hours, which multiply to Wh). Your devices are rated in watts. The calculator divides available Wh by total watts to estimate hours of runtime.
        </p>
      </ExplanationSection>

      <ExplanationSection id="volt-ah" title="Why voltage and amp-hours both matter">
        <p>
          A battery&rsquo;s energy in watt-hours equals its voltage multiplied by its capacity in amp-hours: Wh = V &times; Ah. A 12 V, 100 Ah battery stores 1,200 Wh.
        </p>
        <p>
          Two batteries with the same amp-hour rating but different voltages hold very different amounts of energy. Always include voltage when converting from amp-hours.
        </p>
      </ExplanationSection>

      <ExplanationSection id="usable-capacity" title="Why usable capacity differs from nominal capacity">
        <p>
          A battery&rsquo;s nominal (nameplate) capacity is its total stored energy. But you typically cannot use all of it. Lead-acid batteries should not be deeply discharged, lithium batteries have a battery-management floor, and UPS units shut down early to protect the battery.
        </p>
        <p>
          The &ldquo;usable share&rdquo; setting models this. The default 80% is an editable example, not a recommendation. Check your battery manufacturer&rsquo;s discharge limits.
        </p>
      </ExplanationSection>

      <ExplanationSection id="inverter-losses" title="Why your inverter uses some energy">
        <p>
          If your devices run on AC power, the battery&rsquo;s DC energy must be converted by an inverter. That conversion is not 100% efficient&mdash;some energy is lost as heat. The default 85% AC efficiency means 15% of the battery energy is lost before it reaches your device.
        </p>
        <p>
          Inverters also draw a small amount of power just by being switched on, even with nothing plugged in. Enter this &ldquo;idle draw&rdquo; in watts to include it. The calculator only applies it when at least one enabled AC device has a positive load.
        </p>
      </ExplanationSection>

      <ExplanationSection id="actual-runtime" title="Why actual runtime can differ">
        <p>This simplified model does not account for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Lead-acid discharge-rate effects (Peukert&rsquo;s law).</li>
          <li>Battery aging and capacity loss over time.</li>
          <li>Temperature effects on battery chemistry.</li>
          <li>Startup surges from motors, compressors, or power supplies.</li>
          <li>Dynamic laptop charging behavior (a laptop draws less when its battery is full).</li>
          <li>Automatic low-load shutdown on some inverters and UPS units.</li>
          <li>UPS-specific discharge curves and transfer behavior.</li>
        </ul>
        <p className="text-sm text-navy-600">
          Planning estimate only. Actual runtime varies with battery condition, temperature, discharge rate, device behavior, conversion losses, and equipment limits. Check manufacturer runtime charts where available.
        </p>
      </ExplanationSection>

      <ExplanationSection id="router-vs-office" title="Router-only versus full home-office backup">
        <p>
          A router and fiber ONT together draw around 18 W. On a 500 Wh battery (80% usable, 10% reserve, 85% inverter efficiency), that runs for roughly 12 hours. Adding a 45 W laptop cuts that dramatically.
        </p>
        <p>
          The &ldquo;Essential only&rdquo; scenario shows what happens if you keep just the devices you marked essential. The &ldquo;Suggested changes&rdquo; scenario simulates switching off nonessential devices one at a time to show the biggest runtime gains first.
        </p>
      </ExplanationSection>

      <ExplanationSection id="find-power" title="How to find your device&rsquo;s power consumption">
        <p>
          Check the label on the device or its power adapter. Look for a wattage rating or for volts and amps (V &times; A = W). Note that adapter ratings often describe the maximum the adapter can supply, not the device&rsquo;s actual consumption.
        </p>
        <p>
          For the most accurate reading, use a plug-in power meter (often called a &ldquo;kill-a-watt&rdquo; meter). This measures real-world draw, which is usually lower than the label rating.
        </p>
      </ExplanationSection>

      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <h2 className="text-base font-semibold text-amber-700">Safety note</h2>
          <p className="mt-2 text-sm text-amber-700">
            This tool does not assess wiring safety, battery compatibility, or medical-equipment backup requirements. Do not use it as the sole basis for critical power planning.
          </p>
        </div>
      </div>
    </div>
  );
}
