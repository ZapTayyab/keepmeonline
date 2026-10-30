import { useEffect, useState } from 'react';

export type Route = '/' | '/about' | '/privacy' | '/terms' | '/contact' | '/blog' | '/blog/post';

export interface RouteState {
  route: Route;
  blogSlug: string | null;
}

function parseRoute(hash: string): RouteState {
  const path = hash.replace(/^#/, '').split('?')[0];
  if (path === '/about') return { route: '/about', blogSlug: null };
  if (path === '/privacy') return { route: '/privacy', blogSlug: null };
  if (path === '/terms') return { route: '/terms', blogSlug: null };
  if (path === '/contact') return { route: '/contact', blogSlug: null };
  if (path === '/blog') return { route: '/blog', blogSlug: null };
  if (path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '');
    if (slug) return { route: '/blog/post', blogSlug: slug };
  }
  return { route: '/', blogSlug: null };
}

export function useRouter(): [RouteState, (route: Route, blogSlug?: string) => void] {
  const [state, setState] = useState<RouteState>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      if (window.location.hash.startsWith('#config=')) return;
      setState(parseRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = (next: Route, blogSlug?: string) => {
    if (next === '/blog/post' && blogSlug) {
      window.location.hash = `/blog/${blogSlug}`;
    } else {
      window.location.hash = next;
    }
    setState(parseRoute(window.location.hash));
    window.scrollTo(0, 0);
  };

  return [state, navigate];
}
