import { verifyApiPassword } from '../../../lib/security.js'
import { getSupabaseAdmin } from '../../../lib/supabase.js'
import config from '../../../config/site.config.js'

export const dynamic = 'force-dynamic'

const getSiteName = () => process.env.SITE_NAME || 'aitoolsindia'

function sanitize(str) {
  if (!str) return ''
  return str
    .replace(/&lt;[^&]*&gt;/g, '')
    .replace(/&lt;/g, '').replace(/&gt;/g, '').replace(/&amp;/g, '&')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/href=["'][^"']*["']/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ').trim()
}

function isBadExcerpt(str) {
  if (!str) return true
  if (str.includes('&lt;')) return true
  if (str.includes('href=')) return true
  if (str.includes('news.google.com')) return true
  if (str.startsWith('http')) return true
  if (str.length < 15) return true
  return false
}

export async function GET(request) {
  if (!verifyApiPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getSupabaseAdmin()
    const siteName = getSiteName()

    // Fetch ALL posts — fix both null AND bad excerpts
    const { data: posts } = await db
      .from('posts')
      .select('id, title, excerpt, content, meta_description')
      .eq('site_name', siteName)
      .limit(100)

    if (!posts || posts.length === 0) {
      return Response.json({ message: 'No posts found', fixed: 0 })
    }

    let fixed = 0
    const fixedTitles = []

    for (const post of posts) {
      // Skip if excerpt is already clean
      if (post.excerpt && !isBadExcerpt(post.excerpt)) continue

      let postContent = post.content
      if (typeof postContent === 'string') {
        try { postContent = JSON.parse(postContent) } catch {}
      }

      // Build clean excerpt from best source
      const candidates = [
        post.meta_description,
        postContent?.hook,
        postContent?.sections?.[0]?.body,
        postContent?.rawContent?.split('\n\n')?.[0],
      ]

      let excerpt = ''
      for (const c of candidates) {
        const cleaned = sanitize(c || '')
        if (cleaned.length >= 30 && !isBadExcerpt(cleaned)) {
          excerpt = cleaned.substring(0, 250)
          break
        }
      }

      if (!excerpt) {
        excerpt = `${post.title} — Latest AI tools news and insights on AIToolsIndia.in`
      }

      await db
        .from('posts')
        .update({ excerpt })
        .eq('id', post.id)
        .eq('site_name', siteName)

      fixed++
      fixedTitles.push(post.title?.slice(0, 50))
    }

    // Also delete posts with clearly empty/junk content
    const { data: allPosts } = await db
      .from('posts')
      .select('id, title, content, meta_description')
      .eq('site_name', siteName)
      .limit(100)

    let deleted = 0
    for (const post of allPosts || []) {
      let c = post.content
      if (typeof c === 'string') try { c = JSON.parse(c) } catch {}
      const hasContent = c?.sections?.length > 0 || (c?.rawContent?.length > 200)
      const metaIsJunk = post.meta_description?.includes('&lt;') || post.meta_description?.includes('news.google.com')
      if (!hasContent && metaIsJunk) {
        await db.from('posts').delete().eq('id', post.id).eq('site_name', siteName)
        deleted++
      }
    }

    return Response.json({
      message: 'Done',
      total: posts.length,
      fixed,
      deleted,
      titles: fixedTitles,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
