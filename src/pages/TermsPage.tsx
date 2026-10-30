import type { Route } from '@/lib/router';
import { PageLayout } from '@/components/layout/PageLayout';

export function TermsPage({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <PageLayout
      title="Terms of Service"
      description="Terms and conditions for using the Keep Me Online calculator and resources."
      navigate={navigate}
    >
      <section>
        <h2 className="text-xl font-semibold text-navy-900">1. Acceptance of Terms</h2>
        <p className="mt-2 text-navy-600">
          By accessing and using Keep Me Online (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;the website&rdquo;), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use this site.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">2. Educational & Planning Tool Only (Disclaimer)</h2>
        <p className="mt-2 text-navy-600">
          The calculations, runtime estimates, formulas, and guides provided on Keep Me Online are for informational and planning purposes only. Real-world performance depends heavily on environmental temperature, inverter conversion efficiency, battery age, state of health, Peukert&rsquo;s law effects on lead-acid batteries, and specific device surges.
        </p>
        <p className="mt-2 text-navy-600">
          Always refer to official manufacturer specifications and consult qualified electrical or equipment professionals before designing or relying on life-critical, medical, or high-risk power systems.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">3. Limitation of Liability</h2>
        <p className="mt-2 text-navy-600">
          In no event shall Keep Me Online, its authors, or maintainers be held liable for any loss of power, data corruption, hardware damage, business interruption, or financial damages arising from reliance on the estimations provided by this website.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">4. Intellectual Property</h2>
        <p className="mt-2 text-navy-600">
          All original calculators, written content, guides, and layouts on this website are protected by intellectual property laws. You may use the calculator and share calculation links freely for personal and non-commercial educational use.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">5. Advertising & Third-Party Links</h2>
        <p className="mt-2 text-navy-600">
          This site may present third-party advertisements and links to external resources or retailers. We do not endorse or assume responsibility for any third-party products, services, or privacy practices.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">6. Modifications to Terms</h2>
        <p className="mt-2 text-navy-600">
          We reserve the right to revise these Terms of Service at any time. Continued use of the website following any changes signifies your agreement to the updated terms.
        </p>
      </section>
    </PageLayout>
  );
}
