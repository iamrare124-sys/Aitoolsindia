import Groq from 'groq-sdk'
import config from '../config/site.config.js'

let _groq = null

function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY not set')
    _groq = new Groq({ apiKey: key })
  }
  return _groq
}

// ─── BANNED PHRASES ───────────────────────────────────────────────────────
const BANNED_PHRASES = [
  'Furthermore', 'Moreover', 'In this article', 'It is important to note',
  'Delve into', 'In conclusion', 'Robust', 'Comprehensive', 'Dive into',
  'Leverage', 'Utilize', 'Embark', 'Navigate the complexities',
  "In today's digital age", "It's worth noting", 'At the end of the day',
]

// ─── AI-DETECTION PATTERNS (quality check) ────────────────────────────────
const AI_PATTERNS = [
  'it is worth noting',
  'it should be noted',
  'one must consider',
  'in light of',
  'with regard to',
  'it is important to',
  'needless to say',
  'as previously mentioned',
  'it goes without saying',
  'in terms of',
]

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `${config.aiPersonality}

BANNED PHRASES — never use these: ${BANNED_PHRASES.join(', ')}

ANTI-AI-DETECTION RULES (follow strictly):
1. VARY sentence length aggressively: 4 words. Then a much longer sentence that builds on the previous point with specific detail. Then medium. Never 3 sentences same length in a row.
2. USE contractions always: it's, don't, won't, here's, that's, they're
3. START 2-3 sentences with "And" or "But" — real journalists do this
4. ADD one personal aside per section: "And honestly?", "Here's the thing —", "Look,", "Real talk:"
5. INCLUDE one rhetorical question per article
6. USE em-dashes for interruptions — like this — instead of commas
7. NEVER use: "It is worth noting", "It should be noted", "One must consider", "In light of", "With regard to"
8. NUMBERS in first paragraph always — specific, not vague
9. ONE opinion stated as fact: "This is the most important development in weeks."
10. ACTIVE voice always. Never passive.

Output format — use EXACTLY these markers, no extra text before TITLE::
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
END`

// ─── HUMANIZE PASS ────────────────────────────────────────────────────────
async function humanizeContent(rawContent) {
  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      temperature: 0.9,
      messages: [{
        role: 'user',
        content: `Rewrite this article to sound like a real human journalist wrote it.

RULES:
1. Break long sentences into 2-3 shorter ones
2. Add 1-2 conversational asides like "And honestly?" or "Here's the thing —"
3. Use contractions: "it's", "don't", "here's", "that's"
4. Start 2-3 sentences with "And" or "But" (humans do this, AI avoids it)
5. Add one slightly informal phrase per section
6. Remove any remaining formal/academic phrasing
7. Keep all facts, numbers, and quotes EXACTLY the same
8. Keep the same structure and headings
9. Output ONLY the rewritten article, no preamble

ARTICLE:
${rawContent}`,
      }],
    })
    return completion.choices[0]?.message?.content?.trim() || rawContent
  } catch {
    return rawContent // fallback to original if humanize fails
  }
}

// ─── PARSE SECTIONS ───────────────────────────────────────────────────────
function parseSections(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return []
  const sections = []
  const headingRegex = /^#{1,3}\s+(.+)$/gm
  const hasHeadings = headingRegex.test(rawContent)

  if (hasHeadings) {
    const parts = rawContent.split(/^#{1,3}\s+/m)
    const intro = parts[0].trim()
    if (intro) sections.push({ type: 'intro', heading: null, body: intro })

    const headingMatches = [...rawContent.matchAll(/^(#{1,3})\s+(.+)$/gm)]
    for (let i = 0; i < headingMatches.length; i++) {
      const heading = headingMatches[i][2].trim()
      const start = headingMatches[i].index + headingMatches[i][0].length
      const end = i + 1 < headingMatches.length ? headingMatches[i + 1].index : rawContent.length
      const body = rawContent.slice(start, end).trim()
      if (heading || body) sections.push({ type: 'section', heading, body })
    }
  } else {
    const paragraphs = rawContent.split(/\n\n+/).filter(p => p.trim().length > 30)
    if (paragraphs.length === 0) {
      sections.push({ type: 'intro', heading: null, body: rawContent })
    } else {
      sections.push({ type: 'intro', heading: null, body: paragraphs[0] })
      for (let i = 1; i < paragraphs.length; i++) {
        sections.push({ type: 'section', heading: null, body: paragraphs[i] })
      }
    }
  }
  return sections
}

// ─── PARSE FAQ ────────────────────────────────────────────────────────────
function parseFAQ(faqRaw) {
  if (!faqRaw) return []
  const faqs = []
  const blocks = faqRaw.split(/\n\s*\n/).filter(Boolean)
  for (const block of blocks) {
    const qMatch = block.match(/^Q:\s*(.+)/m)
    const aMatch = block.match(/^A:\s*([\s\S]+)/m)
    if (qMatch && aMatch) faqs.push({ q: qMatch[1].trim(), a: aMatch[1].trim() })
  }
  return faqs
}

// ─── PARSE OUTPUT ─────────────────────────────────────────────────────────
function parseOutput(raw) {
  const extract = (marker, endMarker) => {
    const start = raw.indexOf(`${marker}\n`)
    if (start === -1) {
      const inlineStart = raw.indexOf(`${marker} `)
      if (inlineStart === -1) return ''
      const lineEnd = raw.indexOf('\n', inlineStart)
      return raw.slice(inlineStart + marker.length + 1, lineEnd === -1 ? undefined : lineEnd).trim()
    }
    const contentStart = start + marker.length + 1
    const end = endMarker ? raw.indexOf(endMarker, contentStart) : raw.length
    return raw.slice(contentStart, end === -1 ? raw.length : end).trim()
  }

  const title = extract('TITLE:').replace(/^TITLE:\s*/i, '')
  const metaTitle = extract('META_TITLE:').replace(/^META_TITLE:\s*/i, '')
  const rawMetaDesc = extract('META_DESC:').replace(/^META_DESC:\s*/i, '')
  // Clean any HTML entities that leaked into metaDesc
  const metaDesc = rawMetaDesc
    .replace(/&lt;[^&]*&gt;/g, '')
    .replace(/&lt;/g, '').replace(/&gt;/g, '').replace(/&amp;/g, '&')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ').trim()
  const tagsRaw = extract('TAGS:').replace(/^TAGS:\s*/i, '')
  const categoryRaw = extract('CATEGORY:').replace(/^CATEGORY:\s*/i, '')
  const contentRaw = extract('CONTENT:', 'FAQ:')
  const faqRaw = extract('FAQ:', 'END')

  const tags = tagsRaw.split(',').map(t => t.trim().replace(/[\[\]]/g, '')).filter(Boolean)
  const category = categoryRaw.trim() || 'ai-news'
  const sections = parseSections(contentRaw)
  const faq = parseFAQ(faqRaw)

  return {
    title: title || 'AI News Update',
    metaTitle: metaTitle || title || 'AI News Update',
    metaDesc: metaDesc || '',
    tags,
    category,
    content: { sections, hook: sections[0]?.body || '' },
    faq,
    rawContent: raw,
  }
}

// ─── QUALITY CHECK ────────────────────────────────────────────────────────
function qualityCheck(parsed, raw) {
  const issues = []
  const lowerRaw = raw.toLowerCase()

  // Banned phrases
  for (const phrase of BANNED_PHRASES) {
    if (lowerRaw.includes(phrase.toLowerCase())) {
      issues.push(`Banned phrase: "${phrase}"`)
    }
  }

  // AI detection patterns
  for (const pattern of AI_PATTERNS) {
    if (lowerRaw.includes(pattern)) {
      issues.push(`AI pattern: "${pattern}"`)
    }
  }

  if (!parsed.title || parsed.title.length < 10) issues.push('Title too short')
  if (!parsed.content.sections || parsed.content.sections.length < 3) issues.push('Too few sections')

  const totalWords = raw.split(/\s+/).length
  if (totalWords < 400) issues.push(`Too short: ${totalWords} words`)

  const score = Math.max(0, 10 - issues.length * 2)
  return { score, issues }
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────
export async function generatePost(story) {
  const groq = getGroq()
  const userPrompt = `Write a detailed blog post about this news for Indian AI professionals:

Title: ${story.title}
Source: ${story.source}
Summary: ${story.description || story.title}
Published: ${story.pubDate || story.publishedAt}

Primary keyword to include naturally: ${config.keywords?.primary || 'AI tools india'}
Site: ${config.siteName} — ${config.tagline}

Write 900-1100 words. Be opinionated and practical. Give real Indian examples.`

  let lastParsed = null
  let lastRaw = ''

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
      })

      const raw = res.choices[0]?.message?.content || ''
      const parsed = parseOutput(raw)
      const { score, issues } = qualityCheck(parsed, raw)

      console.log(`Attempt ${attempt}: score ${score}/10, issues: ${issues.join('; ') || 'none'}`)

      // Check AI patterns — retry if found
      const hasAiPattern = AI_PATTERNS.some(p => raw.toLowerCase().includes(p))
      if (hasAiPattern) {
        console.warn(`Attempt ${attempt}: AI pattern detected, retrying`)
        lastParsed = parsed
        lastRaw = raw
        continue
      }

      if (score >= 7) {
        // Humanize pass
        const humanized = await humanizeContent(parsed.rawContent)
        const humanizedParsed = parseOutput(humanized)
        return {
          ...parsed,
          content: humanizedParsed.content.sections.length > 0
            ? humanizedParsed.content
            : parsed.content,
          rawContent: humanized,
        }
      }

      lastParsed = parsed
      lastRaw = raw
    } catch (err) {
      console.error(`Generation attempt ${attempt} failed:`, err.message)
    }
  }

  // Best effort after 3 retries — still humanize
  if (lastParsed) {
    try {
      const humanized = await humanizeContent(lastRaw)
      const humanizedParsed = parseOutput(humanized)
      return {
        ...lastParsed,
        content: humanizedParsed.content.sections.length > 0
          ? humanizedParsed.content
          : lastParsed.content,
        rawContent: humanized,
      }
    } catch {}
  }

  // All 3 retries failed with no usable content — throw so cron skips this story
  throw new Error(`Blog generation failed after 3 attempts for: ${story.title?.slice(0, 60)}`)
}

export async function rewritePostInLanguage(post, language) {
  // Stub for future multilingual support
  return post
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/^-|-$/g, '')
}
