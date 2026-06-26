import { getPostBySlug, getPosts, getRelatedPosts } from '../../lib/supabase.js';
import config from '../../config/site.config.js';
import { notFound } from 'next/navigation';
import PostCard from '../../components/PostCard';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: [config.author.name],
      section: post.category,
      tags: post.tags || [],
      images: post.cover_image ? [{ url: post.cover_image, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export async function generateStaticParams() {
  try {
    const posts = await getPosts({ limit: 50 });
    return posts.map((p) => ({ slug: p.slug }));
  } catch { return []; }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return ''; }
}

function getCatLabel(slug) {
  const cat = config.categories.find((c) => c.slug === slug);
  return cat ? `${cat.icon} ${cat.name}` : slug;
}

function renderContent(content) {
  if (!content) return null;

  // Handle sections array — support BOTH 'heading' and 'h2' keys
  if (typeof content === 'object' && content.sections && content.sections.length > 0) {
    return content.sections.map((sec, i) => (
      <div key={i}>
        {(sec.heading || sec.h2) && <h2>{sec.heading || sec.h2}</h2>}
        {sec.body && sec.body.split('\n\n').map((para, j) => {
          const trimmed = para.trim();
          if (!trimmed) return null;
          // Strip markdown bold
          const cleaned = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1');
          if (cleaned.startsWith('# ') || cleaned.startsWith('## ') || cleaned.startsWith('### ')) {
            return <h2 key={j}>{cleaned.replace(/^#{1,3}\s+/, '')}</h2>;
          }
          if (cleaned.startsWith('- ') || cleaned.startsWith('* ')) {
            const items = cleaned.split('\n').filter(Boolean);
            return (
              <ul key={j}>
                {items.map((item, k) => (
                  <li key={k}>{item.replace(/^[-*]\s+/, '')}</li>
                ))}
              </ul>
            );
          }
          return <p key={j}>{cleaned}</p>;
        })}
      </div>
    ));
  }

  // rawContent string fallback
  if (typeof content === 'object' && content.rawContent && content.rawContent.length > 100) {
    return renderStringContent(content.rawContent);
  }

  // Plain string fallback
  if (typeof content === 'string' && content.length > 100) {
    return renderStringContent(content);
  }

  return <p style={{color:'#888',fontStyle:'italic'}}>Content is being updated. Please check back shortly.</p>;
}

function renderStringContent(str) {
  if (!str) return null;
  const paragraphs = str.split('\n\n').filter((p) => p.trim().length > 0);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      return <h2 key={i}>{trimmed.replace(/^#{1,3}\s+/, '')}</h2>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(Boolean);
      return (
        <ul key={i}>
          {items.map((item, j) => <li key={j}>{item.replace(/^[-*]\s+/, '')}</li>)}
        </ul>
      );
    }
    return <p key={i}>{trimmed}</p>;
  });
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Parse content if still string
  let content = post.content;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch {}
  }

  const related = await getRelatedPosts(slug, post.category, 3);
  const readingTime = post.reading_time || Math.ceil((JSON.stringify(content || '').split(' ').length) / 200);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: config.author.name },
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      url: config.siteUrl,
    },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    image: post.cover_image ? [post.cover_image] : [],
    url: `${config.siteUrl}/${post.slug}`,
    articleSection: post.category,
    keywords: (post.tags || []).join(', '),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: config.siteUrl },
      { '@type': 'ListItem', position: 2, name: getCatLabel(post.category), item: `${config.siteUrl}/category/${post.category}` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${config.siteUrl}/${post.slug}` },
    ],
  };

  const faqSchema = post.faq && post.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  } : null;

  return (
    <>
      {/* Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* Reading progress bar */}
      <div className="progress-bar" id="reading-progress" style={{ width: '0%' }} />

      {/* Article hero */}
      <div className="article-hero">
        <div className="container">
          {/* Breadcrumb */}
          <nav style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <a href="/" style={{ color: 'var(--text-muted)' }}>Home</a>
            {' '}/{' '}
            <a href={`/category/${post.category}`} style={{ color: 'var(--text-muted)' }}>{getCatLabel(post.category)}</a>
          </nav>

          {post.category && (
            <div className="article-cat-badge">{getCatLabel(post.category)}</div>
          )}
          <h1 className="article-title">{post.title}</h1>

          <div className="article-meta-bar">
            <div className="article-author-mini">
              <div className="author-dot">{config.author.initials}</div>
              <span className="author-dot-name">{config.author.name}</span>
            </div>
            <span className="meta-sep">·</span>
            <span className="meta-date">📅 {formatDate(post.published_at)}</span>
            <span className="meta-sep">·</span>
            <span className="meta-read">⏱ {readingTime} min read</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="container">
        <div className="page-grid" style={{ paddingTop: '32px' }}>
          <div className="main-col">
            {/* Featured image */}
            {post.cover_image && (
              <div className="article-featured-img">
                <img src={post.cover_image} alt={post.title} />
              </div>
            )}

            {/* Content */}
            <article className="article-content">
              {renderContent(content)}
            </article>

            {/* FAQ */}
            {post.faq && post.faq.length > 0 && (
              <div className="faq-section">
                <h2>Frequently Asked Questions</h2>
                {post.faq.map((item, i) => (
                  <div key={i} className="faq-item">
                    <div className="faq-q">
                      <span>{item.q}</span>
                      <span>▾</span>
                    </div>
                    <div className="faq-a">{item.a}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="article-tags">
                {post.tags.map((tag) => (
                  <a key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="article-tag">
                    #{tag}
                  </a>
                ))}
              </div>
            )}

            {/* Share */}
            <div className="article-share">
              <span className="share-label">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${config.siteUrl}/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn"
              >
                𝕏 Twitter
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${config.siteUrl}/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn"
              >
                📱 WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${config.siteUrl}/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn"
              >
                in LinkedIn
              </a>
              <CopyButton url={`${config.siteUrl}/${post.slug}`} />
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div style={{ marginTop: '48px' }}>
                <div className="section-header">
                  <h2 className="section-title">📚 <span>Related</span> Articles</h2>
                </div>
                <div className="post-list">
                  {related.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
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
            <div className="widget">
              <div className="widget-header"><span className="icon">📂</span> Categories</div>
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
            <div className="widget">
              <div className="widget-header"><span className="icon">🏷️</span> Tags</div>
              <div className="widget-body">
                <div className="tag-cloud">
                  {config.tags.slice(0, 10).map((tag) => (
                    <a key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="tag-pill">{tag}</a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Reading progress script */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          var bar = document.getElementById('reading-progress');
          if(!bar) return;
          window.addEventListener('scroll', function(){
            var h = document.documentElement;
            var pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
            bar.style.width = Math.min(pct, 100) + '%';
          }, { passive: true });
        })();
      `}} />
    </>
  );
}

// Inline client-safe copy button (rendered server-side as an anchor, JS upgrades it)
function CopyButton({ url }) {
  return (
    <>
      <button
        className="share-btn copy"
        id="copy-link-btn"
        data-url={url}
        aria-label="Copy link"
      >
        🔗 Copy Link
      </button>
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          var btn = document.getElementById('copy-link-btn');
          if(!btn) return;
          btn.addEventListener('click', function(){
            navigator.clipboard.writeText(btn.dataset.url).then(function(){
              btn.textContent = '✅ Copied!';
              setTimeout(function(){ btn.textContent = '🔗 Copy Link'; }, 2000);
            });
          });
        })();
      `}} />
    </>
  );
}
