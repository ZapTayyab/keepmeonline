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
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Heading, Subheading & Calculate Button */}
          <div className="lg:col-span-7">
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
            <div ref={ctaRef} className="mt-8">
              <button onClick={onCalculate} className="btn-primary text-base shadow-md hover:shadow-lg transition-all">
                Calculate my backup
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right Column: Cascading Floating Blocks (2, 3, 4) */}
          <div className="flex flex-col items-start lg:items-end gap-5 lg:col-span-5 lg:pr-4">
            {/* 2: Free */}
            <div className="lg:mr-16 animate-float-slow">
              <div className="inline-flex items-center gap-2 rounded-xl border border-teal-500/20 bg-white/95 px-5 py-2.5 shadow-soft backdrop-blur-md transition-all hover:scale-105 hover:border-teal-500/40">
                <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
                <span className="text-sm font-semibold text-navy-900">Free</span>
              </div>
            </div>

            {/* 3: No signup */}
            <div className="lg:mr-8 animate-float-delayed">
              <div className="inline-flex items-center gap-2 rounded-xl border border-navy-900/10 bg-white/95 px-5 py-2.5 shadow-soft backdrop-blur-md transition-all hover:scale-105 hover:border-teal-500/40">
                <span className="text-sm font-semibold text-navy-900">No signup</span>
              </div>
            </div>

            {/* 4: Your inputs stay in your browser */}
            <div className="animate-float-reverse">
              <div className="inline-flex items-center gap-2 rounded-xl border border-navy-900/10 bg-white/95 px-5 py-2.5 shadow-soft backdrop-blur-md transition-all hover:scale-105 hover:border-teal-500/40">
                <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
                <span className="text-sm font-semibold text-navy-900">Your inputs stay in your browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
