import { getPosts } from '../lib/supabase.js';
import config from '../config/site.config.js';
import PostCard from '../components/PostCard';

export const revalidate = 1800; // 30 min ISR

export default async function HomePage() {
  let posts = [];
  try { posts = await getPosts({ limit: 20 }); } catch {}

  const featured = posts[0] || null;
  const rest = posts.slice(1);
  const trending = posts.slice(0, 5);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">🇮🇳 Made for India</div>
            <h1>
              <em>AI Tools</em> &amp; ChatGPT<br />Guides for India
            </h1>
            <p className="hero-sub">
              Latest AI news, free tools &amp; practical guides for Indian professionals — explained simply.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-val">50K+</div>
                <div className="stat-lab">Monthly Readers</div>
              </div>
              <div className="stat">
                <div className="stat-val">200+</div>
                <div className="stat-lab">AI Guides</div>
              </div>
              <div className="stat">
                <div className="stat-val">100%</div>
                <div className="stat-lab">Free Content</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {posts.length === 0 ? (
          <div style={{ padding: '40px 0' }}>
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <h2 className="empty-title">No posts yet — AI is warming up!</h2>
              <p className="empty-sub">
                Trigger the cron job to generate your first AI-written articles.
              </p>
              <code className="empty-code">
                GET /api/cron?secret=YOUR_CRON_SECRET
              </code>
            </div>
          </div>
        ) : (
          <div className="page-grid">
            {/* Main column */}
            <div className="main-col">
              {/* Featured */}
              {featured && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="section-header">
                    <h2 className="section-title">🔥 <span>Featured</span></h2>
                  </div>
                  <PostCard post={featured} featured />
                </div>
              )}

              {/* Latest */}
              {rest.length > 0 && (
                <div>
                  <div className="section-header">
                    <h2 className="section-title">⚡ <span>Latest</span> AI News</h2>
                    <a href="/search" className="see-all">View all →</a>
                  </div>
                  <div className="post-list">
                    {rest.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="sidebar">
              {/* Trending */}
              <div className="widget">
                <div className="widget-header">
                  <span className="icon">📈</span> Trending Now
                </div>
                <div className="widget-body">
                  <div className="trending-list">
                    {trending.map((post, i) => (
                      <a key={post.id} href={`/${post.slug}`} className="trending-item">
                        <span className="trending-num">0{i + 1}</span>
                        <span className="trending-title">{post.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Author */}
              <div className="widget">
                <div className="widget-header">
                  <span className="icon">✍️</span> About the Author
                </div>
                <div className="widget-body">
                  <div className="author-card">
                    <div className="author-avatar">{config.author.initials}</div>
                    <div className="author-name">{config.author.name}</div>
                    <div className="author-role">{config.author.title}</div>
                    <p className="author-bio">{config.author.bio}</p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="widget">
                <div className="widget-header">
                  <span className="icon">📂</span> Categories
                </div>
                <div className="widget-body">
                  <div className="tag-cloud">
                    {config.categories.map((cat) => (
                      <a key={cat.slug} href={`/category/${cat.slug}`} className="tag-pill">
                        {cat.icon} {cat.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="widget">
                <div className="widget-header">
                  <span className="icon">🏷️</span> Popular Tags
                </div>
                <div className="widget-body">
                  <div className="tag-cloud">
                    {config.tags.slice(0, 12).map((tag) => (
                      <a key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="tag-pill">
                        {tag}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
