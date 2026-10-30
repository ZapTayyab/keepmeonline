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
    <header className="no-print fixed top-3 left-0 right-0 z-40 mx-auto max-w-6xl px-4 pointer-events-none sm:px-6">
      <div className="relative pointer-events-auto rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 shadow-lg shadow-navy-900/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/80 hover:shadow-xl sm:px-6 sm:py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleNav('/')}
            className="group flex items-center gap-2.5 font-semibold text-navy-900 transition"
            aria-label="Keep Me Online home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-400 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-navy-900">
              Keep Me Online
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.route === currentRoute ||
                  (item.route === '/blog' && currentRoute === '/blog/post');
                return (
                  <li key={item.route}>
                    <button
                      onClick={() => handleNav(item.route)}
                      className={`relative rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-teal-600/10 text-teal-800 shadow-xs font-semibold'
                          : 'text-navy-700 hover:bg-navy-900/5 hover:text-navy-900'
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
              className="inline-flex items-center justify-center rounded-xl p-2 text-navy-700 hover:bg-navy-900/5 hover:text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
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

        {/* Mobile Dropdown Menu with matching Glassmorphism */}
        {mobileMenuOpen && (
          <div className="mt-3 border-t border-navy-900/10 pt-3 md:hidden animate-fade-in">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.route === currentRoute ||
                  (item.route === '/blog' && currentRoute === '/blog/post');
                return (
                  <button
                    key={item.route}
                    onClick={() => handleNav(item.route)}
                    className={`block w-full text-left rounded-xl px-3.5 py-2.5 text-base font-medium transition ${
                      isActive
                        ? 'bg-teal-600/10 text-teal-800 font-semibold'
                        : 'text-navy-700 hover:bg-navy-900/5'
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
      </div>
    </header>
  );
}
