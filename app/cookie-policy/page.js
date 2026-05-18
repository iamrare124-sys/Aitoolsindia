import config from '../../config/site.config.js';

export const metadata = { title: `Cookie Policy — ${config.siteName}` };

export default function CookiePolicyPage() {
  return (
    <div className="static-page">
      <h1>Cookie Policy</h1>
      <p className="page-date">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p>This Cookie Policy explains how {config.siteName} uses cookies and similar technologies when you visit our website.</p>
      <h2>What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.</p>
      <h2>Types of Cookies We Use</h2>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for the website to function properly. Cannot be disabled.</li>
        <li><strong>Analytics Cookies:</strong> We use Google Analytics to understand how visitors use our site. These cookies collect anonymized data.</li>
        <li><strong>Advertising Cookies:</strong> Google AdSense uses cookies to show relevant advertisements. These may track your browsing across sites.</li>
        <li><strong>Preference Cookies:</strong> Remember your settings like cookie consent preferences.</li>
      </ul>
      <h2>How to Control Cookies</h2>
      <p>You can control cookies through your browser settings. Most browsers allow you to refuse or delete cookies. Note that disabling cookies may affect website functionality.</p>
      <p>To opt out of Google Analytics, visit <a href="https://tools.google.com/dlpage/gaoptout">Google Analytics Opt-out</a>.</p>
      <h2>Contact</h2>
      <p>Questions about our cookie use? Email <a href="mailto:privacy@aitoolsindia.in">privacy@aitoolsindia.in</a>.</p>
    </div>
  );
}
