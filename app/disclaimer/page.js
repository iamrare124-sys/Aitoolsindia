import config from '../../config/site.config.js'

export const metadata = { title: `Disclaimer — ${config.siteName}` }

export default function DisclaimerPage() {
  const email = `hello@${config.domain}`
  return (
    <div className="static-page">
      <h1>Disclaimer</h1>
      <p className="page-date">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p>The information on {config.siteName} is provided for general informational purposes only. All information is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>
      <h2>AI-Generated Content</h2>
      <p>Some articles on this site are generated using artificial intelligence. While we review content for quality, AI-generated articles may contain inaccuracies. Do not rely solely on our content for financial, legal, medical, or other professional decisions.</p>
      <h2>Affiliate Disclosure</h2>
      <p>Some links on this website may be affiliate links. If you click on an affiliate link and make a purchase, we may earn a commission at no additional cost to you. We only recommend tools and services we genuinely believe are useful.</p>
      <h2>External Links</h2>
      <p>Our site may contain links to other websites. We have no control over the content of those sites and accept no responsibility for them.</p>
      <p>For questions, contact <a href={`mailto:${email}`}>{email}</a>.</p>
    </div>
  )
}
