import './globals.css';
import MobileMenu from '../components/MobileMenu';
import CookieBanner from '../components/CookieBanner';
import config from '../config/site.config.js';
import { getLiveData } from '../lib/live-data.js';

export const metadata = {
  title: {
    default: `${config.siteName} — ${config.tagline}`,
    template: `%s | ${config.siteName}`,
  },
  description: config.description,
  keywords: [config.keywords.primary, ...config.keywords.secondary].join(', '),
  authors: [{ name: config.author.name }],
  creator: config.author.name,
  metadataBase: new URL(config.siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: config.siteUrl,
    siteName: config.siteName,
    title: `${config.siteName} — ${config.tagline}`,
    description: config.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${config.siteName} — ${config.tagline}`,
    description: config.description,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION },
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }) {
  let liveData = [];
  try { liveData = await getLiveData(); } catch {}

  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const hasGA4 = ga4Id && ga4Id !== 'G-XXXXXXXXXX' && ga4Id.startsWith('G-');
  const hasAdsense = adsenseId && adsenseId !== 'ca-pub-XXXXXXXXXXXXXXXXX' && adsenseId.startsWith('ca-pub-');

  return (
    <html lang="en">
      <head>
        {hasGA4 && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4Id}');` }} />
          </>
        )}
        {hasAdsense && (
          <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`} crossOrigin="anonymous" />
        )}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body>
        {/* Live ticker */}
        <div className="ticker-bar">
          <div className="ticker-inner" aria-hidden="true">
            {[...liveData, ...liveData].map((item, i) => (
              <div key={i} className="ticker-item">
                <span className="label">{item.label}</span>
                <span>{item.value}</span>
                <span className={item.up ? 'up' : 'down'}>{item.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <header className="header">
          <a href="/" className="header-logo">
            <div className="logo-icon">🤖</div>
            <span className="logo-text">
              <span>AI</span>toolsindia
            </span>
          </a>

          <div className="header-search">
            <span className="search-icon">🔍</span>
            <form action="/search" method="get">
              <input
                type="search"
                name="q"
                placeholder="Search AI tools, ChatGPT guides..."
                aria-label="Search"
              />
            </form>
          </div>

          <div className="header-actions">
            <MobileMenu categories={config.categories} />
          </div>
        </header>

        {/* Category nav */}
        <nav className="cat-nav" aria-label="Categories">
          <div className="cat-nav-inner">
            <a href="/" className="cat-link">🏠 Home</a>
            {config.categories.map((cat) => (
              <a key={cat.slug} href={`/category/${cat.slug}`} className="cat-link">
                {cat.icon} {cat.name}
              </a>
            ))}
            <a href="/about" className="cat-link">About</a>
          </div>
        </nav>

        {/* Main */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <div className="header-logo" style={{ marginBottom: '10px' }}>
                  <div className="logo-icon">🤖</div>
                  <span className="logo-text"><span>AI</span>toolsindia</span>
                </div>
                <p className="footer-tagline">{config.tagline}<br />Helping Indian professionals stay ahead with AI.</p>
                <div className="footer-social">
                  <a href="#" className="social-btn" aria-label="Twitter/X">𝕏</a>
                  <a href="#" className="social-btn" aria-label="YouTube">▶</a>
                  <a href="#" className="social-btn" aria-label="LinkedIn">in</a>
                  <a href="#" className="social-btn" aria-label="Instagram">◈</a>
                </div>
              </div>
              <div>
                <p className="footer-col-title">Categories</p>
                <div className="footer-links">
                  {config.categories.map((cat) => (
                    <a key={cat.slug} href={`/category/${cat.slug}`} className="footer-link">
                      {cat.name}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="footer-col-title">Resources</p>
                <div className="footer-links">
                  <a href="/about" className="footer-link">About Us</a>
                  <a href="/search" className="footer-link">Search</a>
                  <a href="/disclaimer" className="footer-link">Disclaimer</a>
                </div>
              </div>
              <div>
                <p className="footer-col-title">Legal</p>
                <div className="footer-links">
                  <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
                  <a href="/terms" className="footer-link">Terms of Use</a>
                  <a href="/cookie-policy" className="footer-link">Cookie Policy</a>
                  <a href="/disclaimer" className="footer-link">Disclaimer</a>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <p className="footer-copy">© {new Date().getFullYear()} {config.siteName}. All rights reserved. Made with ❤️ in India.</p>
              <div className="footer-legal">
                <a href="/privacy-policy">Privacy</a>
                <a href="/terms">Terms</a>
                <a href="/cookie-policy">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Back to top */}
        <button id="back-top" aria-label="Back to top" title="Back to top">↑</button>

        {/* Cookie banner */}
        <CookieBanner />

        {/* Back to top script */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var btn = document.getElementById('back-top');
            if(!btn) return;
            window.addEventListener('scroll', function(){
              btn.classList.toggle('visible', window.scrollY > 400);
            }, { passive: true });
            btn.addEventListener('click', function(){
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          })();
        `}} />
      </body>
    </html>
  );
}
