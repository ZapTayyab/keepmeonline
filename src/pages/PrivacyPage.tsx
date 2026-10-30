import type { Route } from '@/lib/router';
import { PageLayout } from '@/components/layout/PageLayout';

export function PrivacyPage({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <PageLayout
      title="Privacy Policy"
      description="How Keep Me Online handles your data, cookies, and privacy."
      navigate={navigate}
    >
      <section>
        <h2 className="text-xl font-semibold text-navy-900">1. Overview</h2>
        <p className="mt-2 text-navy-600">
          Keep Me Online values your privacy. We are committed to transparency regarding any data we handle or that third-party service providers collect when you visit our website.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">2. No Account & Browser-Side Calculations</h2>
        <p className="mt-2 text-navy-600">
          Keep Me Online does not require an account or registration. All calculations, battery calculations, device wattages, and runtime projections are computed entirely inside your web browser. We never send your entered data to our server.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">3. Local Storage</h2>
        <p className="mt-2 text-navy-600">
          Your saved equipment lists and settings are stored locally on your device via HTML5 Local Storage so your setup persists across page reloads. This information never leaves your device and can be cleared at any time using the &ldquo;Clear saved settings&rdquo; button on the calculator or through your browser settings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">4. Cookies & Third-Party Advertising</h2>
        <p className="mt-2 text-navy-600">
          To maintain Keep Me Online as a free resource, we may display advertisements served by third-party advertising partners, including <strong>Google AdSense</strong>, <strong>PropellerAds</strong>, or <strong>Adsterra</strong>.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-navy-600">
          <li>
            <strong>Google AdSense:</strong> Google, as a third-party vendor, uses cookies (including the DoubleClick cookie) to serve ads based on your prior visits to this and other websites. You may opt out of personalized advertising by visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 underline hover:text-teal-700"
            >
              Google Ads Settings
            </a>{' '}
            or{' '}
            <a
              href="https://www.aboutads.info"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 underline hover:text-teal-700"
            >
              aboutads.info
            </a>.
          </li>
          <li>
            <strong>Adsterra & PropellerAds:</strong> Third-party ad networks may use cookies, web beacons, or unique device identifiers to deliver targeted advertisements and measure campaign effectiveness.
          </li>
          <li>
            <strong>Cookie Management:</strong> You can choose to accept or decline cookies using our consent banner or by adjusting your browser cookie settings. Disabling cookies will not affect the core functionality of the battery calculator.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">5. Hosting & Server Logs</h2>
        <p className="mt-2 text-navy-600">
          Like virtually all web hosts (e.g., Cloudflare, Vercel, Netlify), our hosting providers automatically log standard HTTP requests (such as your IP address, browser user-agent, date/time stamp, and referring URL) for server security, DDoS defense, and infrastructure diagnostics.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">6. CCPA & GDPR Privacy Rights</h2>
        <p className="mt-2 text-navy-600">
          Depending on your location (such as the European Economic Area or California), you may have rights under the GDPR or CCPA regarding personal data, including the right to request deletion or opt out of the sale or sharing of personal information. Since we do not collect personal identities, emails, or names, our third-party ad vendors handle cookie-level compliance in accordance with industry consent frameworks.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">7. Contact Information</h2>
        <p className="mt-2 text-navy-600">
          If you have questions about this Privacy Policy, please reach out via our{' '}
          <button
            onClick={() => navigate('/contact')}
            className="text-teal-600 underline hover:text-teal-700 font-medium"
          >
            Contact page
          </button>.
        </p>
      </section>
    </PageLayout>
  );
}
