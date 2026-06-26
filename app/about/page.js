import config from '../../config/site.config.js'

export const metadata = {
  title: `About — ${config.siteName}`,
  description: `Learn about ${config.siteName} and our mission to help Indian professionals leverage AI tools.`,
}

export default function AboutPage() {
  const email = `hello@${config.domain}`
  return (
    <div className="container">
      <div className="about-hero">
        <div className="hero-badge">🇮🇳 About Us</div>
        <h1>{config.siteName}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '500px', margin: '0 auto' }}>
          {config.tagline}
        </p>
      </div>

      <div className="about-content" style={{ paddingBottom: '60px' }}>
        <div className="widget" style={{ marginBottom: '24px' }}>
          <div className="widget-body" style={{ padding: '32px' }}>
            <div className="author-card">
              <div className="author-avatar" style={{ width: '88px', height: '88px', fontSize: '36px' }}>
                {config.author.initials}
              </div>
              <div className="author-name" style={{ fontSize: '22px', marginTop: '12px' }}>{config.author.name}</div>
              <div className="author-role">{config.author.title}</div>
              <p className="author-bio" style={{ fontSize: '15px', marginTop: '12px', maxWidth: '480px', margin: '12px auto 0' }}>
                {config.author.bio}
              </p>
            </div>
          </div>
        </div>

        <p>
          <strong style={{ color: 'var(--text-primary)' }}>{config.siteName}</strong> is India&apos;s go-to resource for AI tools, ChatGPT guides, and practical tech advice for professionals across the country.
        </p>
        <p>
          We believe every Indian professional — whether you&apos;re a CA in Mumbai, a teacher in Pune, or a freelancer from Hyderabad — deserves to know how AI can boost their career and income. No jargon, no fluff.
        </p>
        <p>
          Our AI-powered content engine publishes daily updates on the latest tools, guides and trends — always with an Indian context and always free.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '32px 0' }}>
          {[
            { icon: '🇮🇳', title: 'India First', desc: 'All content tailored for Indian professionals and use cases' },
            { icon: '🆓', title: 'Always Free', desc: 'We prioritize free and affordable AI tools for everyone' },
            { icon: '🤖', title: 'AI Powered', desc: 'Daily AI-written content reviewed for accuracy and quality' },
            { icon: '💡', title: 'Practical', desc: 'Real examples you can use in your work today' },
          ].map((item) => (
            <div key={item.title} className="widget" style={{ padding: '20px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '6px' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <p>
          Have a question or want to collaborate? Reach us at{' '}
          <a href={`mailto:${email}`} style={{ color: 'var(--accent)' }}>{email}</a>
        </p>
      </div>
    </div>
  )
}
