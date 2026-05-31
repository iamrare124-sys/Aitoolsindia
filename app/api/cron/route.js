import { verifyCronSecret } from '../../../lib/security.js'
import { fetchAllSources, selectBestStory } from '../../../lib/rss-fetcher.js'
import { generatePost, slugify } from '../../../lib/blog-generator.js'
import { postExists, savePost, getPosts } from '../../../lib/supabase.js'
import { fetchImageForPost } from '../../../lib/image-fetcher.js'
import config from '../../../config/site.config.js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function pingIndexNow(slug) {
  const key = process.env.INDEX_NOW_KEY
  if (!key) return
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || config.siteUrl
    const url = `${siteUrl}/${slug}`
    fetch(`/api/indexnow?url=${encodeURIComponent(url)}`, { method: 'POST' }).catch(() => {})
  } catch {}
}

export async function GET(request) {
  const startTime = Date.now()

  if (!verifyCronSecret(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const posts = []
  const errors = []
  let published = 0
  const requested = 1

  try {
    // Fetch news from all 4 sources
    const stories = await fetchAllSources()
    if (stories.length === 0) {
      return Response.json({
        success: false,
        requested,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: ['No stories found from any RSS/Reddit source'],
      })
    }

    // Get recently used titles to avoid duplicates
    let usedTitles = []
    try {
      const existing = await getPosts({ limit: 10 })
      usedTitles = existing.map(p => p.title)
    } catch {}

    const story = selectBestStory(stories, usedTitles)
    if (!story) {
      return Response.json({
        success: false,
        requested,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: ['No suitable story found (all duplicates or no keyword match)'],
      })
    }

    // Check duplicate by source URL
    const exists = await postExists(story.link)
    if (exists) {
      return Response.json({
        success: true,
        requested,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: [`Story already published: ${story.link}`],
      })
    }

    // Generate blog post with AI
    const generated = await generatePost(story)
    const slug = slugify(generated.title || story.title)

    // Double-check slug doesn't exist
    const slugExists = await postExists(slug)
    if (slugExists) {
      return Response.json({
        success: true,
        requested,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: [`Slug already exists: ${slug}`],
      })
    }

    // Fetch cover image
    let coverImage = null
    let coverImageAlt = null
    try {
      const img = await fetchImageForPost(generated.title, generated.category)
      coverImage = img?.url || null
      coverImageAlt = img?.alt || generated.title
    } catch {}

    // Build excerpt — 3-level fallback chain
    const excerpt =
      generated.metaDesc ||
      generated.content?.hook ||
      generated.content?.sections?.[0]?.body?.substring(0, 160) ||
      `${generated.title} — ${config.tagline}`

    // Estimate reading time
    const wordCount = JSON.stringify(generated.content || '').split(/\s+/).length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    // Save post — site_name injected by savePost() via getSiteName()
    const postData = {
      slug,
      title: generated.title,
      meta_title: generated.metaTitle,
      meta_description: generated.metaDesc,
      excerpt: excerpt.substring(0, 300),
      category: generated.category || 'ai-news',
      tags: generated.tags || [],
      content: {
        ...generated.content,
        rawContent: generated.rawContent || '',
      },
      faq: generated.faq || [],
      cover_image: coverImage,
      cover_image_alt: coverImageAlt,
      author_name: config.author?.name || 'Editor',
      author_title: config.author?.title || '',
      reading_time: readingTime,
      word_count: wordCount,
      ai_score: 7,
      published: true,
      published_at: new Date().toISOString(),
      source_url: story.link,
      source_headline: story.title,
    }

    await savePost(postData)
    published++
    posts.push({ slug, title: generated.title, category: generated.category })

    // Ping IndexNow (fire and forget)
    pingIndexNow(slug)

    return Response.json({
      success: true,
      requested,
      published,
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
      posts,
      errors,
    })
  } catch (err) {
    console.error('Cron error:', err)
    errors.push(err.message)
    return Response.json({
      success: false,
      requested,
      published,
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
      posts,
      errors,
    }, { status: 500 })
  }
}
