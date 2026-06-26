import { createClient } from '@supabase/supabase-js'

let _supabase = null
let _supabaseAdmin = null

const getSiteName = () => process.env.SITE_NAME || 'aitoolsindia'
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon'
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service'

export function getSupabase() {
  if (!_supabase) _supabase = createClient(url(), anon())
  return _supabase
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient(url(), svc(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _supabaseAdmin
}

const POST_LIMIT = parseInt(process.env.MAX_POSTS_PER_SITE || '30')

export async function getPosts({ limit = 12, offset = 0, category } = {}) {
  try {
    const siteName = getSiteName()
    const SELECT_COLS = 'id, slug, title, excerpt, category, tags, cover_image, cover_image_alt, author_name, reading_time, created_at, published_at'

    // PRIMARY: filter by site_name + published=true
    let query = getSupabase()
      .from('posts')
      .select(SELECT_COLS)
      .eq('site_name', siteName)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (category) query = query.eq('category', category)

    const { data, error } = await query

    if (error) {
      console.error('getPosts primary query error:', error.message)
      // FALLBACK A: maybe 'published' column doesn't exist yet — try without it
      let fallbackQuery = getSupabase()
        .from('posts')
        .select(SELECT_COLS)
        .eq('site_name', siteName)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (category) fallbackQuery = fallbackQuery.eq('category', category)
      const { data: fbData, error: fbErr } = await fallbackQuery
      if (fbErr) {
        console.error('getPosts fallback A error:', fbErr.message)
        // FALLBACK B: maybe site_name column doesn't exist — get all posts
        let noSiteQuery = getSupabase()
          .from('posts')
          .select(SELECT_COLS)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        if (category) noSiteQuery = noSiteQuery.eq('category', category)
        const { data: nsData } = await noSiteQuery
        return nsData || []
      }
      return fbData || []
    }

    // If published filter returned 0 rows, try without published filter
    // (handles case where posts were inserted with published=null or column missing)
    if (data && data.length === 0 && offset === 0) {
      let retryQuery = getSupabase()
        .from('posts')
        .select(SELECT_COLS)
        .eq('site_name', siteName)
        .order('created_at', { ascending: false })
        .range(0, limit - 1)
      if (category) retryQuery = retryQuery.eq('category', category)
      const { data: retryData } = await retryQuery
      if (retryData && retryData.length > 0) {
        console.warn('getPosts: published filter returned 0, falling back to unpublished query. Fix: run ALTER TABLE posts ALTER COLUMN published SET DEFAULT true; UPDATE posts SET published=true WHERE published IS NULL;')
        return retryData
      }
    }

    return data || []
  } catch (err) {
    console.error('getPosts error:', err.message)
    return []
  }
}

export async function getPostBySlug(slug) {
  try {
    const siteName = getSiteName()
    // Try with site_name + published filter
    const { data, error } = await getSupabase()
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('site_name', siteName)
      .maybeSingle()

    if (error || !data) {
      // Fallback: find by slug only
      const { data: fbData } = await getSupabase()
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (!fbData) return null
      if (fbData.content && typeof fbData.content === 'string') {
        try { fbData.content = JSON.parse(fbData.content) } catch {}
      }
      return fbData
    }

    if (data.content && typeof data.content === 'string') {
      try { data.content = JSON.parse(data.content) } catch {}
    }
    // Fire-and-forget view increment
    getSupabaseAdmin()
      .from('posts')
      .update({ views: (data.views || 0) + 1 })
      .eq('slug', slug)
      .eq('site_name', siteName)
      .then(() => {})
    return data
  } catch (err) {
    console.error('getPostBySlug error:', err.message)
    return null
  }
}

export async function getRelatedPosts(category, currentSlug, limit = 3) {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabase()
      .from('posts')
      .select('slug, title, excerpt, cover_image, reading_time, created_at, category, author_name')
      .eq('site_name', siteName)
      .neq('slug', currentSlug)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  } catch { return [] }
}

export async function getTrendingPosts(limit = 5) {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabase()
      .from('posts')
      .select('id, slug, title, category, created_at, views, reading_time')
      .eq('site_name', siteName)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  } catch { return [] }
}

export async function savePost(postData) {
  const dataWithSite = { ...postData, site_name: getSiteName(), published: true }
  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .insert(dataWithSite)
    .select()
    .single()
  if (error) throw error
  await enforcePostLimit()
  return data
}

export async function postExists(sourceUrl) {
  if (!sourceUrl) return false
  try {
    const siteName = getSiteName()
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .select('id')
      .eq('source_url', sourceUrl)
      .eq('site_name', siteName)
      .maybeSingle()
    if (error) throw error
    return !!data
  } catch { return false }
}

async function enforcePostLimit() {
  try {
    const siteName = getSiteName()
    const { count } = await getSupabaseAdmin()
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('site_name', siteName)
    if (!count || count <= POST_LIMIT) return
    const { data: oldest } = await getSupabaseAdmin()
      .from('posts')
      .select('id')
      .eq('site_name', siteName)
      .order('created_at', { ascending: true })
      .limit(count - POST_LIMIT)
    if (oldest?.length) {
      await getSupabaseAdmin().from('posts').delete().in('id', oldest.map(p => p.id))
    }
  } catch (err) { console.error('enforcePostLimit error:', err.message) }
}

export async function searchPosts(query) {
  try {
    const siteName = getSiteName()
    const q = query.trim().toLowerCase()
    const { data, error } = await getSupabase()
      .from('posts')
      .select('id, slug, title, excerpt, category, cover_image, published_at')
      .eq('site_name', siteName)
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) return []
    return data || []
  } catch { return [] }
}

export async function getTotalPostCount(category = null) {
  try {
    const siteName = getSiteName()
    let query = getSupabase()
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('site_name', siteName)
    if (category) query = query.eq('category', category)
    const { count } = await query
    return count || 0
  } catch { return 0 }
}
