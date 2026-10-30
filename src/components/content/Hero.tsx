import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Zap, ShieldCheck, ArrowDown } from 'lucide-react';
import { HeroBackground } from '@/components/hero/HeroBackground';

interface HeroProps {
  onCalculate: () => void;
}

export function Hero({ onCalculate }: HeroProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(badgeRef.current, { y: 20, opacity: 0, duration: 0.5 })
        .from(headingRef.current, { y: 30, opacity: 0, duration: 0.7 }, '-=0.2')
        .from(subheadingRef.current, { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from(
          ctaRef.current?.children ?? [],
          { y: 20, opacity: 0, duration: 0.5, stagger: 0.15 },
          '-=0.3'
        );
    });

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section className="relative overflow-hidden border-b border-navy-900/10 bg-cream-100">
      <HeroBackground reducedMotion={prefersReducedMotion} />
      <div className="bg-grid absolute inset-0 z-0 opacity-40" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/90 px-3 py-1 text-xs font-medium text-teal-700 backdrop-blur-sm"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Power-cut backup planner
          </div>
          <h1
            ref={headingRef}
            className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl sm:leading-tight"
          >
            Will your backup power keep you online?
          </h1>
          <p ref={subheadingRef} className="mt-4 text-lg text-navy-600">
            Estimate how long your router, laptop, and essentials can run&mdash;and discover what to switch off to last longer.
          </p>
          <div ref={ctaRef} className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
            <button onClick={onCalculate} className="btn-primary text-base shadow-md hover:shadow-lg transition-all shrink-0">
              Calculate my backup
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-xs backdrop-blur-sm transition-transform hover:scale-105 animate-float-slow">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" aria-hidden="true" />
                Free
              </span>
              <span className="inline-flex items-center rounded-full border border-teal-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-navy-700 shadow-xs backdrop-blur-sm transition-transform hover:scale-105 animate-float-delayed">
                No signup
              </span>
              <span className="inline-flex items-center rounded-full border border-teal-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-navy-700 shadow-xs backdrop-blur-sm transition-transform hover:scale-105 animate-float-reverse">
                Your inputs stay in your browser
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
