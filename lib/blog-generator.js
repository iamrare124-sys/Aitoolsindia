import Groq from 'groq-sdk';
import config from '../config/site.config.js';

let _groq = null;

function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY not set');
    _groq = new Groq({ apiKey: key });
  }
  return _groq;
}

const BANNED_PHRASES = [
  'Furthermore', 'Moreover', 'In this article', 'It is important to note',
  'Delve into', 'In conclusion', 'Robust', 'Comprehensive', 'Dive into',
  'Leverage', 'Utilize', 'Embark', 'Navigate the complexities',
  'In today\'s digital age', 'It\'s worth noting', 'At the end of the day',
];

const SYSTEM_PROMPT = `${config.aiPersonality}

BANNED PHRASES — never use these: ${BANNED_PHRASES.join(', ')}

Output format — use EXACTLY these markers:
TITLE: [Engaging headline with primary keyword]
META_TITLE: [60 chars max SEO title]
META_DESC: [150 chars max meta description]
TAGS: [tag1, tag2, tag3, tag4, tag5]
CATEGORY: [one of: ai-news, chatgpt-guides, free-ai-tools, ai-for-work]
CONTENT:
[Full article with ## headings, 800-1200 words]
FAQ:
Q: [Question 1]
A: [Answer 1]

Q: [Question 2]
A: [Answer 2]

Q: [Question 3]
A: [Answer 3]

Q: [Question 4]
A: [Answer 4]
END`;

function parseSections(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return [];

  const sections = [];

  // Try to parse ## or # headings
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const hasHeadings = headingRegex.test(rawContent);

  if (hasHeadings) {
    const parts = rawContent.split(/^#{1,3}\s+/m);
    // First part is the hook/intro (before first heading)
    const intro = parts[0].trim();
    if (intro) {
      sections.push({ type: 'intro', heading: null, body: intro });
    }

    // Remaining parts: first line is heading, rest is body
    const headingMatches = [...rawContent.matchAll(/^(#{1,3})\s+(.+)$/gm)];
    for (let i = 0; i < headingMatches.length; i++) {
      const heading = headingMatches[i][2].trim();
      const start = headingMatches[i].index + headingMatches[i][0].length;
      const end = i + 1 < headingMatches.length ? headingMatches[i + 1].index : rawContent.length;
      const body = rawContent.slice(start, end).trim();
      if (heading || body) {
        sections.push({ type: 'section', heading, body });
      }
    }
  } else {
    // No headings — split by double newlines into paragraphs
    const paragraphs = rawContent.split(/\n\n+/).filter((p) => p.trim().length > 30);
    if (paragraphs.length === 0) {
      sections.push({ type: 'intro', heading: null, body: rawContent });
    } else {
      sections.push({ type: 'intro', heading: null, body: paragraphs[0] });
      for (let i = 1; i < paragraphs.length; i++) {
        sections.push({ type: 'section', heading: null, body: paragraphs[i] });
      }
    }
  }

  return sections;
}

function parseFAQ(faqRaw) {
  if (!faqRaw) return [];
  const faqs = [];
  const blocks = faqRaw.split(/\n\s*\n/).filter(Boolean);
  for (const block of blocks) {
    const qMatch = block.match(/^Q:\s*(.+)/m);
    const aMatch = block.match(/^A:\s*([\s\S]+)/m);
    if (qMatch && aMatch) {
      faqs.push({ q: qMatch[1].trim(), a: aMatch[1].trim() });
    }
  }
  return faqs;
}

function parseOutput(raw) {
  const extract = (marker, endMarker) => {
    const start = raw.indexOf(`${marker}\n`);
    if (start === -1) {
      const inlineStart = raw.indexOf(`${marker} `);
      if (inlineStart === -1) return '';
      const lineEnd = raw.indexOf('\n', inlineStart);
      return raw.slice(inlineStart + marker.length + 1, lineEnd === -1 ? undefined : lineEnd).trim();
    }
    const contentStart = start + marker.length + 1;
    const end = endMarker ? raw.indexOf(endMarker, contentStart) : raw.length;
    return raw.slice(contentStart, end === -1 ? raw.length : end).trim();
  };

  const title = extract('TITLE:').replace(/^TITLE:\s*/i, '');
  const metaTitle = extract('META_TITLE:').replace(/^META_TITLE:\s*/i, '');
  const metaDesc = extract('META_DESC:').replace(/^META_DESC:\s*/i, '');
  const tagsRaw = extract('TAGS:').replace(/^TAGS:\s*/i, '');
  const categoryRaw = extract('CATEGORY:').replace(/^CATEGORY:\s*/i, '');
  const contentRaw = extract('CONTENT:', 'FAQ:');
  const faqRaw = extract('FAQ:', 'END');

  const tags = tagsRaw.split(',').map((t) => t.trim().replace(/[\[\]]/g, '')).filter(Boolean);
  const category = categoryRaw.trim() || 'ai-news';
  const sections = parseSections(contentRaw);
  const faq = parseFAQ(faqRaw);

  return {
    title: title || 'AI News Update',
    metaTitle: metaTitle || title || 'AI News Update',
    metaDesc: metaDesc || '',
    tags,
    category,
    content: { sections, hook: sections[0]?.body || '' },
    faq,
    rawContent: raw,
  };
}

function qualityCheck(parsed, raw) {
  const issues = [];
  const lowerRaw = raw.toLowerCase();

  for (const phrase of BANNED_PHRASES) {
    if (lowerRaw.includes(phrase.toLowerCase())) {
      issues.push(`Banned phrase found: "${phrase}"`);
    }
  }

  if (!parsed.title || parsed.title.length < 10) issues.push('Title too short');
  if (!parsed.content.sections || parsed.content.sections.length < 3) issues.push('Too few sections');

  const totalWords = raw.split(/\s+/).length;
  if (totalWords < 400) issues.push(`Too short: ${totalWords} words`);

  const score = Math.max(0, 10 - issues.length * 2);
  return { score, issues };
}

async function humanizePost(rawContent) {
  try {
    const groq = getGroq();
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.9,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are an editor. Take the article content and:
1. Break up any sentences longer than 25 words
2. Remove any AI-sounding transitions
3. Add 1-2 specific Indian examples if missing (e.g., "like a CA in Mumbai using this")
4. Keep the same structure and headings
5. Return ONLY the improved content, no commentary`,
        },
        {
          role: 'user',
          content: rawContent,
        },
      ],
    });
    return res.choices[0]?.message?.content || rawContent;
  } catch {
    return rawContent;
  }
}

export async function generatePost(story) {
  const groq = getGroq();
  const userPrompt = `Write a detailed blog post about this news for Indian AI professionals:

Title: ${story.title}
Source: ${story.source}
Summary: ${story.description || story.title}
Published: ${story.pubDate}

Primary keyword to include naturally: ${config.keywords.primary}
Site: ${config.siteName} — ${config.tagline}

Write 900-1100 words. Be opinionated and practical. Give real examples.`;

  let lastParsed = null;
  let lastRaw = '';

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.85,
        frequency_penalty: 0.4,
        presence_penalty: 0.3,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });

      const raw = res.choices[0]?.message?.content || '';
      const parsed = parseOutput(raw);
      const { score, issues } = qualityCheck(parsed, raw);

      console.log(`Attempt ${attempt}: score ${score}/10, issues: ${issues.join('; ') || 'none'}`);

      if (score >= 7) {
        // Humanize pass
        const humanized = await humanizePost(parsed.rawContent);
        const humanizedParsed = parseOutput(humanized);
        return {
          ...parsed,
          content: humanizedParsed.content.sections.length > 0 ? humanizedParsed.content : parsed.content,
          rawContent: humanized,
        };
      }

      lastParsed = parsed;
      lastRaw = raw;
    } catch (err) {
      console.error(`Generation attempt ${attempt} failed:`, err.message);
    }
  }

  // Return best effort after 3 retries
  return lastParsed || { title: story.title, content: { sections: [], hook: '' }, faq: [], tags: [], category: 'ai-news', metaTitle: story.title, metaDesc: story.description || '', rawContent: lastRaw };
}

export async function rewritePostInLanguage(post, language) {
  // Stub for future multilingual support
  return post;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/^-|-$/g, '');
}

export { slugify };
