import { getSupabase, getSupabaseAdmin } from '../../../lib/supabase.js'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  // Basic password protection
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized — add ?secret=YOUR_CRON_SECRET' }, { status: 401 })
  }

  const siteName = process.env.SITE_NAME || 'aitoolsindia'
  const results = {}

  // ─── TEST 1: ENV VARS ──────────────────────────────────────────
  results.env = {
    SITE_NAME: siteName,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 40) + '...'
      : '❌ NOT SET',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ NOT SET',
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ NOT SET',
    GROQ_API_KEY: process.env.GROQ_API_KEY ? '✅ Set' : '❌ NOT SET',
    CRON_SECRET: process.env.CRON_SECRET ? '✅ Set' : '❌ NOT SET',
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '❌ NOT SET',
  }

  // ─── TEST 2: SUPABASE CONNECTION ────────────────────────────────
  try {
    const db = getSupabase()
    const { data, error } = await db.from('posts').select('id').limit(1)
    if (error) {
      results.supabase_connection = { status: '❌ FAILED', error: error.message, hint: error.hint || '' }
    } else {
      results.supabase_connection = { status: '✅ Connected', test_row: data?.length > 0 ? 'Row found' : 'No rows (empty table?)' }
    }
  } catch (err) {
    results.supabase_connection = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── TEST 3: TOTAL POSTS (no filters) ──────────────────────────
  try {
    const { count, error } = await getSupabase()
      .from('posts')
      .select('*', { count: 'exact', head: true })
    results.total_posts_no_filter = error
      ? { status: '❌ Error', error: error.message }
      : { status: '✅ OK', count }
  } catch (err) {
    results.total_posts_no_filter = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── TEST 4: POSTS FOR THIS SITE_NAME ──────────────────────────
  try {
    const { count, error } = await getSupabase()
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('site_name', siteName)
    results.posts_for_this_site = error
      ? { status: '❌ Error', error: error.message }
      : { status: count > 0 ? '✅ Found' : '⚠️ ZERO — site_name mismatch!', count, site_name_used: siteName }
  } catch (err) {
    results.posts_for_this_site = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── TEST 5: POSTS WITH published=true FILTER ──────────────────
  try {
    const { count, error } = await getSupabase()
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('site_name', siteName)
      .eq('published', true)
    results.posts_published_true = error
      ? { status: '❌ Error — published column missing?', error: error.message }
      : { status: count > 0 ? '✅ Found' : '⚠️ ZERO — posts exist but published=false or null!', count }
  } catch (err) {
    results.posts_published_true = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── TEST 6: WHAT published VALUES EXIST ──────────────────────
  try {
    const { data, error } = await getSupabase()
      .from('posts')
      .select('id, published')
      .eq('site_name', siteName)
      .limit(5)
    results.sample_published_values = error
      ? { status: '❌ Error', error: error.message }
      : { status: '✅ OK', samples: data?.map(r => ({ id: r.id?.substring(0, 8), published: r.published })) }
  } catch (err) {
    results.sample_published_values = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── TEST 7: ALL site_name VALUES IN DB ───────────────────────
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .select('site_name')
      .limit(20)
    if (error) {
      results.all_site_names_in_db = { status: '❌ Error', error: error.message }
    } else {
      const counts = {}
      for (const row of data || []) {
        counts[row.site_name] = (counts[row.site_name] || 0) + 1
      }
      results.all_site_names_in_db = {
        status: '✅ OK',
        site_names_found: counts,
        note: `Your SITE_NAME env = "${siteName}" — must match exactly one of these keys`,
      }
    }
  } catch (err) {
    results.all_site_names_in_db = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── TEST 8: SAMPLE POST DATA ─────────────────────────────────
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .select('slug, title, site_name, published, created_at')
      .order('created_at', { ascending: false })
      .limit(3)
    results.latest_3_posts_raw = error
      ? { status: '❌ Error', error: error.message }
      : { status: '✅ OK', posts: data }
  } catch (err) {
    results.latest_3_posts_raw = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── TEST 9: RLS CHECK ────────────────────────────────────────
  try {
    // Anon key should be able to read published posts
    const { data: anonData, error: anonErr } = await getSupabase()
      .from('posts')
      .select('id, title')
      .limit(1)
    results.rls_anon_read = anonErr
      ? { status: '❌ RLS blocking anon reads!', error: anonErr.message, fix: 'Add policy: CREATE POLICY "Public read" ON posts FOR SELECT USING (true)' }
      : { status: '✅ Anon can read', found: anonData?.length > 0 }
  } catch (err) {
    results.rls_anon_read = { status: '❌ EXCEPTION', error: err.message }
  }

  // ─── DIAGNOSIS ────────────────────────────────────────────────
  const diagnosis = []
  if (results.supabase_connection?.status?.includes('❌')) {
    diagnosis.push('🔴 CRITICAL: Supabase connection fail — check SUPABASE env vars in Vercel')
  }
  if (results.total_posts_no_filter?.count === 0) {
    diagnosis.push('🔴 Table empty — run cron first: GET /api/cron?secret=YOUR_SECRET')
  }
  if (results.posts_for_this_site?.count === 0 && results.total_posts_no_filter?.count > 0) {
    diagnosis.push(`🔴 SITE_NAME mismatch — DB mein alag site_name se posts save hue hain. Upar "all_site_names_in_db" dekho aur Vercel env mein SITE_NAME match karo`)
  }
  if (results.posts_published_true?.count === 0 && results.posts_for_this_site?.count > 0) {
    diagnosis.push('🔴 published column = false/null — Supabase SQL Editor mein run karo: UPDATE posts SET published = true WHERE site_name = \'' + siteName + '\';')
  }
  if (results.rls_anon_read?.status?.includes('❌')) {
    diagnosis.push('🔴 RLS policy missing — Supabase mein anon reads block ho rahi hain. SQL Editor mein run karo: CREATE POLICY "Public read" ON posts FOR SELECT USING (true);')
  }
  if (diagnosis.length === 0) {
    diagnosis.push('✅ Sab theek lag raha hai — agar phir bhi posts nahi dikh rahi toh Vercel mein redeploy karo')
  }

  return Response.json({ diagnosis, results }, { status: 200 })
}
