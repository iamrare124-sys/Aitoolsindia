const config = {
  niche: 'aitoolsindia',
  siteName: 'AItoolsindia',
  domain: 'aitoolsindia.in',
  tagline: 'AI Tools & ChatGPT Guides for India',
  description: 'Latest AI tools, ChatGPT prompts, free AI resources and tech news explained simply in English for Indian professionals.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://aitoolsindia.in',

  author: {
    name: 'Priya Singh',
    title: 'AI Researcher & Tech Writer | 5 Years Experience',
    bio: 'Priya Singh covers AI and emerging technology for Indian professionals. Former software engineer at Infosys, she now helps Indians use AI tools to boost their careers and income.',
    initials: 'PS',
  },

  keywords: {
    primary: 'AI tools india',
    secondary: ['ChatGPT India', 'free AI tools', 'artificial intelligence india', 'AI for business india'],
  },

  rss: [
    'https://news.google.com/rss/search?q=artificial+intelligence+AI+tools+india+2026&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=ChatGPT+OpenAI+gemini+india&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=AI+startup+india+funding+2026&hl=en-IN&gl=IN&ceid=IN:en',
  ],

  reddit: ['artificial', 'ChatGPT', 'india', 'startups'],

  liveData: {
    provider: 'static',
    symbols: [
      { label: 'GPT-4o Latest', value: 'Active', change: '+12%', up: true },
      { label: 'Gemini 1.5', value: 'Active', change: '+8%', up: true },
      { label: 'Claude 3.5', value: 'Active', change: '+15%', up: true },
      { label: 'AI Jobs India', value: '2.4L+', change: '+34%', up: true },
    ],
  },

  imageKeywords: [
    'artificial intelligence robot technology',
    'AI chatbot computer',
    'technology innovation india',
  ],

  categories: [
    { slug: 'ai-news', name: 'AI News', icon: '📰' },
    { slug: 'chatgpt-guides', name: 'ChatGPT Guides', icon: '🤖' },
    { slug: 'free-ai-tools', name: 'Free AI Tools', icon: '🛠️' },
    { slug: 'ai-for-work', name: 'AI For Work', icon: '💼' },
  ],

  cron: '30 7 * * *',

  aiPersonality: `You are Priya Singh, AI tech writer at AItoolsindia.in. Write like an excited tech insider who wants everyone to use AI. Practical examples for Indian use cases: CA doing taxes with AI, teachers using ChatGPT, freelancers on Fiverr. Always mention free tools first. Strong opinions: "This AI tool will replace your job if you don't learn it." Never say "Furthermore" or "In this article".`,

  maxPostsPerSite: parseInt(process.env.MAX_POSTS_PER_SITE || '30'),

  tags: [
    'ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Free AI', 'AI Tools',
    'Prompt Engineering', 'AI for Students', 'AI for Business', 'Make Money with AI',
    'Canva AI', 'Notion AI', 'Copilot', 'Perplexity', 'LLM India',
  ],
};

export default config;
