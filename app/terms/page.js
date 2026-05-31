import config from '../../config/site.config.js'

export const metadata = {
  title: `Terms of Use — ${config.siteName}`,
}

export default function TermsPage() {
  const email = `legal@${config.domain}`
  return (
    <div className="static-page">
      <h1>Terms of Use</h1>
      <p className="page-date">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using {config.siteName} ({config.domain}), you accept and agree to be bound by these Terms of Use. If you do not agree, please do not use our website.</p>

      <h2>2. Content</h2>
      <p>All content on {config.siteName} is for informational and educational purposes only. While we strive for accuracy, we make no warranties about the completeness, reliability, or accuracy of the information.</p>

      <h2>3. AI-Generated Content</h2>
      <p>Some content on this website is generated with the assistance of artificial intelligence. All AI-generated content is reviewed for quality but may contain errors. Always verify important information from primary sources.</p>

      <h2>4. Intellectual Property</h2>
      <p>The content, design, and graphics on {config.siteName} are protected by copyright. You may not reproduce, distribute, or create derivative works without our written permission.</p>

      <h2>5. Third-Party Links</h2>
      <p>Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of those sites.</p>

      <h2>6. Limitation of Liability</h2>
      <p>{config.siteName} shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this website or reliance on its content.</p>

      <h2>7. Changes to Terms</h2>
      <p>We reserve the right to modify these terms at any time. Continued use of the website constitutes acceptance of updated terms.</p>

      <h2>8. Governing Law</h2>
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of Indian courts.</p>

      <h2>9. Contact</h2>
      <p>Questions about these terms? Email us at <a href={`mailto:${email}`}>{email}</a>.</p>
    </div>
  )
}
