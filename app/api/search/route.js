import { searchPosts } from '../../../lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return Response.json({ results: [], query: '' });
  }

  try {
    const results = await searchPosts(q);
    return Response.json({ results, query: q, count: results.length });
  } catch (err) {
    return Response.json({ results: [], query: q, error: err.message }, { status: 500 });
  }
}
