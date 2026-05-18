'use client';

import { useState } from 'react';

export default function MobileMenu({ categories }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn-menu"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        ☰
      </button>

      {/* Overlay */}
      <div
        className={`mobile-menu-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav className={`mobile-menu${open ? ' open' : ''}`} aria-label="Mobile navigation">
        <div className="mobile-menu-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon">🤖</div>
            <span className="logo-text" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>
              <span style={{ color: 'var(--accent)' }}>AI</span>toolsindia
            </span>
          </div>
          <button className="mobile-menu-close" onClick={() => setOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="mobile-menu-body">
          <div className="mobile-menu-section">
            <p className="mobile-menu-label">Navigation</p>
            <a href="/" className="mobile-menu-link" onClick={() => setOpen(false)}>🏠 Home</a>
            <a href="/search" className="mobile-menu-link" onClick={() => setOpen(false)}>🔍 Search</a>
            <a href="/about" className="mobile-menu-link" onClick={() => setOpen(false)}>👤 About</a>
          </div>

          <div className="mobile-menu-section">
            <p className="mobile-menu-label">Categories</p>
            {(categories || []).map((cat) => (
              <a
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="mobile-menu-link"
                onClick={() => setOpen(false)}
              >
                {cat.icon} {cat.name}
              </a>
            ))}
          </div>

          <div className="mobile-menu-section">
            <p className="mobile-menu-label">Legal</p>
            <a href="/privacy-policy" className="mobile-menu-link" onClick={() => setOpen(false)}>Privacy Policy</a>
            <a href="/terms" className="mobile-menu-link" onClick={() => setOpen(false)}>Terms of Use</a>
            <a href="/disclaimer" className="mobile-menu-link" onClick={() => setOpen(false)}>Disclaimer</a>
          </div>

          <a href="/search" className="mobile-take-quiz" onClick={() => setOpen(false)}>
            🔍 Search Articles
          </a>
        </div>
      </nav>
    </>
  );
}
