import { ArrowRight } from 'lucide-react';
import { BLOG_POSTS, type BlogPost } from '@/data/blogPosts';

interface BlogSectionProps {
  onSelectPost: (post: BlogPost) => void;
}

export function BlogSection({ onSelectPost }: BlogSectionProps) {
  return (
    <section id="blog" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="section-heading">Power backup guides</h2>
          <p className="mt-2 text-navy-600">
            Practical articles on battery backup, inverters, and keeping your internet online during outages.
          </p>
        </div>
      </div>

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
              <h3 className="mt-2 text-base font-semibold text-navy-900 group-hover:text-teal-700 transition">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-navy-600 line-clamp-3">{post.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 group-hover:text-teal-700">
                Read article
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
