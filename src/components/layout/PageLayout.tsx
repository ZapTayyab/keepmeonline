import type { Route } from '@/lib/router';

interface PageHeaderProps {
  title: string;
  description?: string;
  navigate: (route: Route) => void;
}

function BackLink({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <button
      onClick={() => navigate('/')}
      className="text-sm font-medium text-teal-600 hover:text-teal-700"
    >
      ← Back to calculator
    </button>
  );
}

export function PageLayout({
  title,
  description,
  navigate,
  children,
}: PageHeaderProps & { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-24 pb-12 sm:px-6 sm:pt-28">
      <BackLink navigate={navigate} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-900">{title}</h1>
      {description && <p className="mt-3 text-lg text-navy-600">{description}</p>}
      <div className="mt-8 space-y-6 text-navy-700 leading-relaxed">{children}</div>
    </div>
  );
}
