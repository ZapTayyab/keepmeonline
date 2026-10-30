import { ArrowRight } from 'lucide-react';
import type { Route } from '@/lib/router';
import type { BlogPost } from '@/data/blogPosts';
import { BLOG_POSTS } from '@/data/blogPosts';
import { AdSlot } from '@/components/AdSlot';

interface BlogListPageProps {
  navigate: (route: Route, blogSlug?: string) => void;
  onSelectPost: (post: BlogPost) => void;
}

export function BlogListPage({ navigate, onSelectPost }: BlogListPageProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <button
        onClick={() => navigate('/')}
        className="text-sm font-medium text-teal-600 hover:text-teal-700"
      >
        ← Back to calculator
      </button>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-900">Power backup blog</h1>
      <p className="mt-3 text-lg text-navy-600">
        Practical guides on battery backup, inverters, and keeping your internet online during outages.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post) => {
          const Icon = post.icon;
          return (
            <article
              key={post.id}
              className="card group cursor-pointer p-5 transition hover:shadow-soft hover:border-teal-300"
              onClick={() => onSelectPost(post)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPost(post);
                }
              }}
              aria-label={`Read article: ${post.title}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-navy-600/70">
                <span className="rounded-full bg-cream-100 px-2 py-0.5 font-medium text-navy-700">
                  {post.category}
                </span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-2 text-base font-semibold text-navy-900 group-hover:text-teal-700 transition">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-navy-600 line-clamp-3">{post.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 group-hover:text-teal-700">
                Read article
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </article>
          );
        })}
      </div>

      <div className="mt-12">
        <AdSlot slotId="blog-list-bottom" format="leaderboard" className="min-h-[90px]" />
      </div>
    </main>
  );
}
