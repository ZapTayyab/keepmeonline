import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import type { BlogPost } from '@/data/blogPosts';
import { BLOG_POSTS } from '@/data/blogPosts';
import { AdSlot } from '@/components/AdSlot';

interface BlogPostPageProps {
  post: BlogPost;
  onBack: () => void;
  onSelectPost: (post: BlogPost) => void;
}

export function BlogPostPage({ post, onBack, onSelectPost }: BlogPostPageProps) {
  const Icon = post.icon;
  const related = BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <button
        onClick={onBack}
        className="text-sm font-medium text-teal-600 hover:text-teal-700"
      >
        <ArrowLeft className="inline h-4 w-4" aria-hidden="true" /> Back to blog
      </button>

      <div className="mt-6 flex items-center gap-2 text-xs text-navy-600/70">
        <span className="rounded-full bg-cream-100 px-2 py-0.5 font-medium text-navy-700">
          {post.category}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {post.readTime}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-900">{post.title}</h1>
      <p className="mt-3 text-lg text-navy-600">{post.excerpt}</p>

      <div className="mt-8 space-y-8">
        {post.content.map((section, index) => (
          <section key={index}>
            <h2 className="text-xl font-semibold text-navy-900">{section.heading}</h2>
            {section.paragraphs.map((para, pIndex) => (
              <p key={pIndex} className="mt-2 text-navy-700 leading-relaxed">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="my-8">
        <AdSlot slotId="blog-in-article" className="min-h-[120px]" />
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-navy-900/10 pt-8">
          <h2 className="text-lg font-semibold text-navy-900">Related articles</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {related.map((rel) => {
              const RelIcon = rel.icon;
              return (
                <button
                  key={rel.id}
                  onClick={() => onSelectPost(rel)}
                  className="card group p-4 text-left transition hover:border-teal-300"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <RelIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-navy-900 group-hover:text-teal-700">
                    {rel.title}
                  </h3>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
