import { createClient } from '@supabase/supabase-js'

let _supabase = null
let _supabaseAdmin = null

const getSiteName = () => process.env.SITE_NAME || 'default'
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon'
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service'

export function getSupabase() {
  if (!_supabase) _supabase = createClient(url(), anon())
  return _supabase
}
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient(url(), svc())
  return _supabaseAdmin
}

const POST_LIMIT = parseInt(process.env.MAX_POSTS_PER_SITE || '30')

export async function getPosts({ limit = 12, offset = 0, category } = {}) {
  try {
    const siteName = getSiteName()
    let query = getSupabase()
      .from('posts')
      .select('id, slug, title, excerpt, category, tags, cover_image, cover_image_alt, author_name, reading_time, created_at, published_at')
      .eq('site_name', siteName)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (category) query = query.eq('category', category)
    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (err) { console.error('getPosts error:', err.message); return [] }
}

export async function getPostBySlug(slug) {
  try {
    const siteName = getSiteName()
    const { data, error } = await getSupabase()
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('site_name', siteName)
      .eq('published', true)
      .maybeSingle()
    if (error || !data) return null
    if (data.content && typeof data.content === 'string') {
      try { data.content = JSON.parse(data.content) } catch {}
    }
    getSupabaseAdmin().from('posts').update({ views: (data.views || 0) + 1 }).eq('slug', slug).then(() => {})
    return data
  } catch (err) { console.error('getPostBySlug error:', err.message); return null }
}

export async function getRelatedPosts(category, currentSlug, limit = 3) {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabase()
      .from('posts')
      .select('slug, title, excerpt, cover_image, reading_time, created_at, category, author_name')
      .eq('site_name', siteName)
      .eq('category', category)
      .eq('published', true)
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
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(limit)
    return data || []
  } catch { return [] }
}

export async function savePost(postData) {
  // Always attach site_name
  const dataWithSite = {
    ...postData,
    site_name: getSiteName(),
  }
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
      .eq('published', true)
    if (!count || count <= POST_LIMIT) return
    const { data: oldest } = await getSupabaseAdmin()
      .from('posts')
      .select('id')
      .eq('site_name', siteName)
      .eq('published', true)
      .order('created_at', { ascending: true })
      .limit(count - POST_LIMIT)
    if (oldest?.length) {
      await getSupabaseAdmin().from('posts').delete().in('id', oldest.map(p => p.id))
      console.log(`Deleted ${oldest.length} old posts for ${siteName}`)
    }
  } catch (err) { console.error('enforcePostLimit error:', err.message) }
}

