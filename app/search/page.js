'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PostCard from '../../components/PostCard';

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, [initialQ]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <>
      <div className="search-header">
        <form onSubmit={handleSubmit} className="search-bar-big">
          <span className="si">🔍</span>
          <input
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="Search AI tools, ChatGPT guides, news..."
            autoFocus
            aria-label="Search"
          />
        </form>
        {searched && (
          <p className="search-results-count">
            {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>
        )}
      </div>

      {loading && (
        <div className="post-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="post-card" style={{ padding: '16px', gap: '16px' }}>
              <div className="sk sk-img" style={{ width: '140px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="sk sk-text" style={{ width: '60%' }} />
                <div className="sk sk-title" style={{ marginTop: '12px' }} />
                <div className="sk sk-text" style={{ width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">No results found</h2>
          <p className="empty-sub">Try different keywords like "ChatGPT", "free AI tools", or "Gemini".</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="post-list">
          {results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {!searched && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Search AI Tools India
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Find ChatGPT guides, free AI tools, and tech news for Indian professionals.
          </p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="container search-page">
      <Suspense fallback={
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading search...
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  );
}
