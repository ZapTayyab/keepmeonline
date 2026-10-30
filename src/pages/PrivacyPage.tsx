import type { Route } from '@/lib/router';
import { PageLayout } from '@/components/layout/PageLayout';

export function PrivacyPage({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <PageLayout
      title="Privacy"
      description="How Keep Me Online handles your data."
      navigate={navigate}
    >
      <section>
        <h2 className="text-xl font-semibold text-navy-900">No accounts, no serverside data</h2>
        <p className="mt-2">
          Keep Me Online does not require an account. Your calculator inputs are processed entirely in your browser. The tool does not send your settings to any application server.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Local storage</h2>
        <p className="mt-2">
          Your settings are saved to your browser&rsquo;s local storage so they persist when you reload the page. This data never leaves your device. You can delete it at any time using the &ldquo;Clear saved settings&rdquo; button on the calculator, or by clearing your browser data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Share links</h2>
        <p className="mt-2">
          When you use &ldquo;Copy share link,&rdquo; your settings are encoded in the link&rsquo;s URL fragment (the part after the #). This data is not sent to a server when the link is opened&mdash;the browser keeps URL fragments local. However, anyone who receives the link can read your configuration. Do not include sensitive information in a shared setup.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">No advertising or analytics</h2>
        <p className="mt-2">
          This site does not load advertising scripts, does not run application-level analytics, and does not use tracking cookies. The site is prepared for a future advertising integration, but no ad scripts are active.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Hosting providers</h2>
        <p className="mt-2">
          The website is hosted on a third-party hosting provider. Like any website, the hosting provider may process normal web request data (such as IP addresses and request logs) as part of delivering the page to your browser. This is separate from the calculator itself.
        </p>
      </section>

      <section className="rounded-lg border border-navy-900/10 bg-cream-100 p-4">
        <h2 className="text-base font-semibold text-navy-900">Developer note</h2>
        <p className="mt-2 text-sm text-navy-600">
          Adding analytics or advertising in the future requires reviewing privacy disclosures, consent requirements, and the actual provider configuration before enabling those services. No AdSense approval or compliance is guaranteed.
        </p>
      </section>
    </PageLayout>
  );
}
