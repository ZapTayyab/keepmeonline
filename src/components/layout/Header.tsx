import { Zap } from 'lucide-react';
import type { Route } from '@/lib/router';

interface HeaderProps {
  currentRoute: string;
  navigate: (route: Route, blogSlug?: string) => void;
}

const NAV_ITEMS: Array<{ route: Route; label: string }> = [
  { route: '/', label: 'Calculator' },
  { route: '/blog', label: 'Blog' },
  { route: '/about', label: 'About' },
  { route: '/privacy', label: 'Privacy' },
  { route: '/contact', label: 'Contact' },
];

export function Header({ currentRoute, navigate }: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-navy-900/10 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-semibold text-navy-900"
          aria-label="Keep Me Online home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg tracking-tight">Keep Me Online</span>
        </button>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.route === currentRoute ||
                (item.route === '/blog' && currentRoute === '/blog/post');
              return (
                <li key={item.route}>
                  <button
                    onClick={() => navigate(item.route)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-navy-600 hover:bg-navy-900/5 hover:text-navy-900'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
