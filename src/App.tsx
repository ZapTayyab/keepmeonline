import { useRouter } from '@/lib/router';
import { useCalculatorState } from '@/lib/useCalculatorState';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { ContactPage } from '@/pages/ContactPage';
import { BlogListPage } from '@/pages/BlogListPage';
import { BlogPostPage } from '@/pages/BlogPostPage';
import { BLOG_POSTS, type BlogPost } from '@/data/blogPosts';

function App() {
  const [routeState, navigate] = useRouter();
  const state = useCalculatorState();

  const { route, blogSlug } = routeState;

  const handleSelectPost = (post: BlogPost) => {
    navigate('/blog/post', post.slug);
  };

  const currentPost = blogSlug
    ? BLOG_POSTS.find((p) => p.slug === blogSlug) ?? null
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header currentRoute={route} navigate={navigate} />
      <div className="flex-1">
        {route === '/' && (
          <HomePage state={state} navigate={navigate} onSelectPost={handleSelectPost} />
        )}
        {route === '/blog' && (
          <BlogListPage navigate={navigate} onSelectPost={handleSelectPost} />
        )}
        {route === '/blog/post' && currentPost && (
          <BlogPostPage
            post={currentPost}
            onBack={() => navigate('/blog')}
            onSelectPost={handleSelectPost}
          />
        )}
        {route === '/blog/post' && !currentPost && (
          <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h1 className="text-2xl font-bold text-navy-900">Article not found</h1>
            <p className="mt-3 text-navy-600">
              The article you are looking for does not exist. It may have been moved or removed.
            </p>
            <button
              onClick={() => navigate('/blog')}
              className="mt-4 btn-primary"
            >
              Back to blog
            </button>
          </main>
        )}
        {route === '/about' && <AboutPage navigate={navigate} />}
        {route === '/privacy' && <PrivacyPage navigate={navigate} />}
        {route === '/contact' && <ContactPage navigate={navigate} />}
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

export default App;
