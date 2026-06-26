import { getPosts, getTotalPostCount } from '../../../lib/supabase.js';
import config from '../../../config/site.config.js';
import PostCard from '../../../components/PostCard';
import { notFound } from 'next/navigation';

export const revalidate = 1800;

export async function generateMetadata({ params }) {
  const { category } = await params;
  const cat = config.categories.find((c) => c.slug === category);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: `${cat.name} — ${config.siteName}`,
    description: `Latest ${cat.name} articles and guides on ${config.siteName}. ${config.description}`,
  };
}

export async function generateStaticParams() {
  return config.categories.map((c) => ({ category: c.slug }));
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const cat = config.categories.find((c) => c.slug === category);
  if (!cat) notFound();

  let posts = [];
  let total = 0;
  try {
    posts = await getPosts({ limit: 20, category });
    total = await getTotalPostCount(category);
  } catch {}

  return (
    <>
      <div className="cat-page-header">
        <div className="container">
          <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '12px' }}>
            {cat.icon} {cat.name}
          </div>
          <h1 className="cat-page-title">{cat.name}</h1>
          <p className="cat-page-sub">
            {total} article{total !== 1 ? 's' : ''} · Latest {cat.name.toLowerCase()} news &amp; guides for Indian professionals
          </p>
        </div>
      </div>

      <div className="container">
        <div className="page-grid">
          <div className="main-col" style={{ paddingTop: '32px' }}>
            {posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{cat.icon}</div>
                <h2 className="empty-title">No articles yet in {cat.name}</h2>
                <p className="empty-sub">Check back soon — we publish daily AI content!</p>
                <a href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>← Back to Home</a>
              </div>
            ) : (
              <div className="post-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          <aside className="sidebar" style={{ paddingTop: '32px' }}>
            <div className="widget">
              <div className="widget-header"><span className="icon">📂</span> All Categories</div>
              <div className="widget-body">
                <div className="tag-cloud">
                  {config.categories.map((c) => (
                    <a
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      className={`tag-pill${c.slug === category ? ' active' : ''}`}
                      style={c.slug === category ? { color: 'var(--accent)', borderColor: 'rgba(255,107,53,0.4)' } : {}}
                    >
                      {c.icon} {c.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="widget">
              <div className="widget-header"><span className="icon">👤</span> Author</div>
              <div className="widget-body">
                <div className="author-card">
                  <div className="author-avatar">{config.author.initials}</div>
                  <div className="author-name">{config.author.name}</div>
                  <div className="author-role">{config.author.title}</div>
                  <p className="author-bio">{config.author.bio}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
