'use client';

export default function Error({ error, reset }) {
  return (
    <div className="container">
      <div className="not-found">
        <div className="not-found-num" style={{ fontSize: '80px' }}>⚠️</div>
        <h1 className="not-found-title">Something went wrong</h1>
        <p className="not-found-sub">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={reset}>Try Again</button>
          <a href="/" className="btn btn-outline">← Home</a>
        </div>
      </div>
    </div>
  );
}
