'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const accepted = localStorage.getItem('cookie-consent');
        if (!accepted) setVisible(true);
      } catch {
        // localStorage not available
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    try { localStorage.setItem('cookie-consent', 'accepted'); } catch {}
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem('cookie-consent', 'declined'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <p className="cookie-text">
        We use cookies to improve your experience. By using AItoolsindia.in, you agree to our{' '}
        <a href="/cookie-policy">Cookie Policy</a>.
      </p>
      <div className="cookie-actions">
        <button className="btn btn-outline" style={{ height: '34px', fontSize: '13px' }} onClick={decline}>
          Decline
        </button>
        <button className="btn btn-primary" style={{ height: '34px', fontSize: '13px' }} onClick={accept}>
          Accept
        </button>
      </div>
    </div>
  );
}
