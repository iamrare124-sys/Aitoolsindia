import { verifyApiPassword } from '../../../lib/security.js'
import { getSupabaseAdmin } from '../../../lib/supabase.js'
import config from '../../../config/site.config.js'

export const dynamic = 'force-dynamic'

const getSiteName = () => process.env.SITE_NAME || 'aitoolsindia'

export async function GET(request) {
  if (!verifyApiPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getSupabaseAdmin()
    const siteName = getSiteName()
    const { data: posts } = await db
      .from('posts')
      .select('id, title, excerpt, content, meta_description')
      .eq('site_name', siteName)
      .or('excerpt.is.null,excerpt.eq.')
      .limit(50)

    if (!posts || posts.length === 0) {
      return Response.json({ message: 'No posts need fixing', fixed: 0 })
    }

    let fixed = 0
    for (const post of posts) {
      let content = post.content
      if (typeof content === 'string') {
        try { content = JSON.parse(content) } catch {}
      }

      const excerpt =
        post.meta_description ||
        content?.hook ||
        content?.sections?.[0]?.body?.substring(0, 160) ||
        `${post.title} — ${config.tagline}`

      await db
        .from('posts')
        .update({ excerpt: excerpt.substring(0, 300) })
        .eq('id', post.id)
        .eq('site_name', siteName)
      fixed++
    }

    return Response.json({ message: 'Excerpts fixed', fixed })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
