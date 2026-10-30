import { Mail } from 'lucide-react';
import type { Route } from '@/lib/router';
import { PageLayout } from '@/components/layout/PageLayout';
import { siteConfig } from '@/config/site';

export function ContactPage({ navigate }: { navigate: (route: Route) => void }) {
  const email = siteConfig.contactEmail;

  return (
    <PageLayout
      title="Contact"
      description="Get in touch about Keep Me Online."
      navigate={navigate}
    >
      {email ? (
        <section>
          <h2 className="text-xl font-semibold text-navy-900">Email</h2>
          <p className="mt-2">
            You can reach us at{' '}
            <a
              href={`mailto:${email}`}
              className="font-medium text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {email}
            </a>
          </p>
        </section>
      ) : (
        <section>
          <h2 className="text-xl font-semibold text-navy-900">Contact</h2>
          <p className="mt-2">
            A public contact address has not yet been added. Please check back later, or refer to the README for instructions on how to configure a contact method before launch.
          </p>
        </section>
      )}

      <section className="rounded-lg border border-navy-900/10 bg-cream-100 p-4">
        <p className="text-sm text-navy-600">
          This page does not include a contact form. A real contact method should be configured before the site is publicly launched.
        </p>
      </section>
    </PageLayout>
  );
}
