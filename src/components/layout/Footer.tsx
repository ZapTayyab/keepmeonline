import { Zap } from 'lucide-react';
import type { Route } from '@/lib/router';

interface FooterProps {
  navigate: (route: Route, blogSlug?: string) => void;
}

export function Footer({ navigate }: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="no-print border-t border-navy-900/10 bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-navy-600">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-600 text-white">
              <Zap className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>Keep Me Online — a free power-cut backup planner.</span>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <li><button onClick={() => navigate('/blog')} className="text-navy-600 hover:text-teal-700">Blog</button></li>
              <li><button onClick={() => navigate('/about')} className="text-navy-600 hover:text-teal-700">About</button></li>
              <li><button onClick={() => navigate('/privacy')} className="text-navy-600 hover:text-teal-700">Privacy</button></li>
              <li><button onClick={() => navigate('/contact')} className="text-navy-600 hover:text-teal-700">Contact</button></li>
            </ul>
          </nav>
        </div>
        <p className="mt-4 text-xs text-navy-600/70">
          Planning estimate only. Actual runtime varies with battery condition, temperature, discharge rate, and equipment limits. Check manufacturer runtime charts where available.
        </p>
        <p className="mt-2 text-xs text-navy-600/60">© {year} Keep Me Online.</p>
      </div>
    </footer>
  );
}
