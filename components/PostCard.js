import config from '../config/site.config.js';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return ''; }
}

function getCatName(slug) {
  const cat = config.categories.find((c) => c.slug === slug);
  return cat ? `${cat.icon} ${cat.name}` : slug;
}

export default function PostCard({ post, featured = false }) {
  if (!post) return null;
  return (
    <a href={`/${post.slug}`} className={`post-card${featured ? ' post-card-featured' : ''}`}>
      <div className="post-card-img">
        {post.image_url ? (
          <img src={post.image_url} alt={post.title} loading="lazy" />
        ) : (
          <div className="post-card-img-placeholder">🤖</div>
        )}
      </div>
      <div className="post-card-body">
        {post.category && (
          <span className="post-card-cat">{getCatName(post.category)}</span>
        )}
        <h3 className="post-card-title">{post.title}</h3>
        {post.excerpt && (
          <p className="post-card-excerpt">{post.excerpt}</p>
        )}
        <div className="post-card-meta">
          <span className="post-meta-item">📅 {formatDate(post.published_at)}</span>
          {post.reading_time && (
            <span className="post-meta-item">⏱ {post.reading_time} min read</span>
          )}
        </div>
      </div>
    </a>
  );
}
