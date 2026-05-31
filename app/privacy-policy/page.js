import config from '../../config/site.config.js'

export const metadata = {
  title: `Privacy Policy — ${config.siteName}`,
  description: `Privacy Policy for ${config.siteName}`,
}

export default function PrivacyPolicyPage() {
  const email = `privacy@${config.domain}`
  return (
    <div className="static-page">
      <h1>Privacy Policy</h1>
      <p className="page-date">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly (e.g., via contact forms) and information collected automatically when you visit our site, including IP address, browser type, pages visited, and time spent on pages.</p>

      <h2>2. Use of Cookies</h2>
      <p>We use cookies and similar tracking technologies to improve your browsing experience. We use Google Analytics to understand how visitors use our site. You can opt out of analytics cookies via your browser settings or our cookie banner.</p>

      <h2>3. Google AdSense</h2>
      <p>We may display advertisements served by Google AdSense. Google uses cookies to serve ads based on your prior visits to our website or other websites. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads">Google Ads Settings</a>.</p>

      <h2>4. How We Use Your Information</h2>
      <ul>
        <li>To improve and personalize your experience</li>
        <li>To analyze site traffic and usage patterns</li>
        <li>To send newsletters (only if you opt in)</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2>5. Data Sharing</h2>
      <p>We do not sell your personal information. We may share anonymized analytics data with third-party analytics providers. We comply with applicable Indian data protection laws.</p>

      <h2>6. Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

      <h2>7. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal information. Contact us at <a href={`mailto:${email}`}>{email}</a> to exercise these rights.</p>

      <h2>8. Contact</h2>
      <p>For privacy-related queries, contact us at <a href={`mailto:${email}`}>{email}</a> or write to us at {config.domain}.</p>
    </div>
  )
}
