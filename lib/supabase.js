import { createClient } from '@supabase/supabase-js';
import config from '../config/site.config.js';

let _supabase = null;
let _supabaseAdmin = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase admin env vars');
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export async function postExists(slug) {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

export async function savePost(post) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('posts').insert(post).select().single();
  if (error) throw error;
  await enforcePostLimit();
  return data;
}

export async function enforcePostLimit() {
  try {
    const db = getSupabaseAdmin();
    const max = config.maxPostsPerSite || 30;
    const { count } = await db.from('posts').select('*', { count: 'exact', head: true });
    if (count > max) {
      const excess = count - max;
      const { data: oldest } = await db
        .from('posts')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(excess);
      if (oldest && oldest.length > 0) {
        const ids = oldest.map((p) => p.id);
        await db.from('posts').delete().in('id', ids);
      }
    }
  } catch (err) {
    console.error('enforcePostLimit error:', err.message);
  }
}

export async function getPosts({ limit = 20, offset = 0, category = null } = {}) {
  try {
    const db = getSupabase();
    let query = db
      .from('posts')
      .select('id, slug, title, excerpt, category, tags, image_url, published_at, reading_time')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug) {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    if (typeof data.content === 'string') {
      try { data.content = JSON.parse(data.content); } catch {}
    }
    return data;
  } catch {
    return null;
  }
}

export async function getRelatedPosts(slug, category, limit = 4) {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('posts')
      .select('id, slug, title, excerpt, category, image_url, published_at')
      .eq('category', category)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function searchPosts(query) {
  try {
    const db = getSupabase();
    const q = query.trim().toLowerCase();
    const { data, error } = await db
      .from('posts')
      .select('id, slug, title, excerpt, category, image_url, published_at')
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,tags.cs.{${q}}`)
      .order('published_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getTotalPostCount(category = null) {
  try {
    const db = getSupabase();
    let query = db.from('posts').select('*', { count: 'exact', head: true });
    if (category) query = query.eq('category', category);
    const { count } = await query;
    return count || 0;
  } catch {
    return 0;
  }
}
