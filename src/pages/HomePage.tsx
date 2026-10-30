import { useRef } from 'react';
import type { CalculatorState } from '@/lib/useCalculatorState';
import type { Route } from '@/lib/router';
import type { BlogPost } from '@/data/blogPosts';
import { Hero } from '@/components/content/Hero';
import { CalculatorPanel } from '@/components/calculator/CalculatorPanel';
import { AdSlot } from '@/components/AdSlot';
import { ExplanatoryContent } from '@/components/content/ExplanatoryContent';
import { WorkedExamples } from '@/components/content/WorkedExamples';
import { FaqSection } from '@/components/content/FaqSection';
import { BlogSection } from '@/components/content/BlogSection';

interface HomePageProps {
  state: CalculatorState;
  navigate: (route: Route, blogSlug?: string) => void;
  onSelectPost: (post: BlogPost) => void;
}

export function HomePage({ state, navigate, onSelectPost }: HomePageProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const calculatorTopRef = useRef<HTMLDivElement>(null);

  const scrollToCalculator = () => {
    calculatorTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectPost = (post: BlogPost) => {
    onSelectPost(post);
  };

  return (
    <main>
      <Hero onCalculate={scrollToCalculator} />

      <div ref={calculatorTopRef}>
        <CalculatorPanel state={state} resultsRef={resultsRef} />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <AdSlot slotId="after-calculator" format="leaderboard" className="min-h-[90px]" />
      </div>

      <WorkedExamples />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <AdSlot slotId="between-examples-content" format="leaderboard" className="min-h-[90px]" />
      </div>

      <ExplanatoryContent />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <AdSlot slotId="between-content-blog" format="leaderboard" className="min-h-[90px]" />
      </div>

      <BlogSection onSelectPost={handleSelectPost} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <AdSlot slotId="between-blog-faq" format="leaderboard" className="min-h-[90px]" />
      </div>

      <FaqSection />
    </main>
  );
}
