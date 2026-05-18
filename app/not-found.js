import config from '../config/site.config.js';

export default function NotFound() {
  return (
    <div className="container">
      <div className="not-found">
        <div className="not-found-num">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-sub">
          This page doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" className="btn btn-primary">← Back to Home</a>
          <a href="/search" className="btn btn-outline">🔍 Search</a>
        </div>
      </div>
    </div>
  );
}
