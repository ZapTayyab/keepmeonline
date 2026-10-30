import { useState } from 'react';
import { Zap, Menu, X } from 'lucide-react';
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
  { route: '/terms', label: 'Terms' },
  { route: '/contact', label: 'Contact' },
];

export function Header({ currentRoute, navigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: Route) => {
    navigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-navy-900/10 bg-cream-50/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={() => handleNav('/')}
          className="flex items-center gap-2 font-semibold text-navy-900"
          aria-label="Keep Me Online home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg tracking-tight font-bold">Keep Me Online</span>
        </button>

        {/* Desktop Navigation */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.route === currentRoute ||
                (item.route === '/blog' && currentRoute === '/blog/post');
              return (
                <li key={item.route}>
                  <button
                    onClick={() => handleNav(item.route)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 shadow-xs'
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

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-navy-700 hover:bg-navy-900/5 hover:text-navy-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-navy-900/10 bg-white md:hidden shadow-lg animate-fade-in">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.route === currentRoute ||
                (item.route === '/blog' && currentRoute === '/blog/post');
              return (
                <button
                  key={item.route}
                  onClick={() => handleNav(item.route)}
                  className={`block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-navy-700 hover:bg-cream-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
