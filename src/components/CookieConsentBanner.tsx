import { useState, useEffect } from 'react';
import type { Route } from '@/lib/router';

interface CookieConsentBannerProps {
  navigate: (route: Route) => void;
}

const STORAGE_KEY = 'kmo_cookie_consent_v1';

export function CookieConsentBanner({ navigate }: CookieConsentBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        setShow(true);
      }
    } catch {
      // If local storage is disabled or throws, do not block UI
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // ignore
    }
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'declined');
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-navy-900/15 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-xs text-navy-700 sm:text-sm">
          We use cookies and third-party services to analyze traffic and serve relevant advertisements. 
          See our{' '}
          <button
            onClick={() => navigate('/privacy')}
            className="text-teal-700 underline font-medium hover:text-teal-800"
          >
            Privacy Policy
          </button>{' '}
          and{' '}
          <button
            onClick={() => navigate('/terms')}
            className="text-teal-700 underline font-medium hover:text-teal-800"
          >
            Terms of Service
          </button>.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDecline}
            className="rounded-md border border-navy-900/20 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-cream-100 transition-colors"
          >
            Decline Non-Essential
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-teal-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
