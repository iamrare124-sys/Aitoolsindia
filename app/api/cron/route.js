import { verifyCronSecret } from '../../../lib/security.js';
import { fetchAllSources, selectBestStory } from '../../../lib/rss-fetcher.js';
import { generatePost, slugify } from '../../../lib/blog-generator.js';
import { postExists, savePost, getPosts } from '../../../lib/supabase.js';
import { fetchImageForPost } from '../../../lib/image-fetcher.js';
import config from '../../../config/site.config.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function pingIndexNow(slug) {
  const key = process.env.INDEX_NOW_KEY;
  if (!key) return;
  try {
    const url = `${config.siteUrl}/${slug}`;
    await fetch(`/api/indexnow?url=${encodeURIComponent(url)}`, { method: 'POST' });
  } catch {}
}

export async function GET(request) {
  const startTime = Date.now();

  if (!verifyCronSecret(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = [];
  const errors = [];
  let published = 0;
  const requested = 1; // One post per cron run

  try {
    // Fetch news
    const stories = await fetchAllSources();
    if (stories.length === 0) {
      return Response.json({
        success: false,
        requested,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: ['No stories found from RSS sources'],
      });
    }

    // Get used titles to avoid duplicates
    let usedTitles = [];
    try {
      const existing = await getPosts({ limit: 10 });
      usedTitles = existing.map((p) => p.title);
    } catch {}

    const story = selectBestStory(stories, usedTitles);
    if (!story) {
      return Response.json({
        success: false,
        requested,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: ['No suitable story found (all duplicates?)'],
      });
    }

    // Generate slug
    const generated = await generatePost(story);
    const slug = slugify(generated.title || story.title);

    // Check if already exists
    const exists = await postExists(slug);
    if (exists) {
      return Response.json({
        success: true,
        requested,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: [`Post already exists: ${slug}`],
      });
    }

    // Fetch image
    let imageUrl = null;
    let imageAlt = null;
    try {
      const img = await fetchImageForPost(generated.title, generated.category);
      imageUrl = img?.url || null;
      imageAlt = img?.alt || generated.title;
    } catch {}

    // Build excerpt with 3 fallbacks
    const excerpt =
      generated.metaDesc ||
      generated.content?.hook ||
      generated.content?.sections?.[0]?.body?.substring(0, 160) ||
      `${generated.title} — ${config.tagline}`;

    // Estimate reading time
    const wordCount = JSON.stringify(generated.content || '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Save post
    const postData = {
      slug,
      title: generated.title,
      meta_title: generated.metaTitle,
      meta_description: generated.metaDesc,
      excerpt: excerpt.substring(0, 300),
      category: generated.category || 'ai-news',
      tags: generated.tags || [],
      content: JSON.stringify({
        ...generated.content,
        rawContent: generated.rawContent || '',
      }),
      faq: generated.faq || [],
      image_url: imageUrl,
      image_alt: imageAlt,
      reading_time: readingTime,
      published_at: new Date().toISOString(),
      source_url: story.link,
      source_title: story.title,
    };

    const saved = await savePost(postData);
    published++;
    posts.push({ slug, title: generated.title, category: generated.category });

    // Ping IndexNow (fire and forget)
    pingIndexNow(slug).catch(() => {});

    return Response.json({
      success: true,
      requested,
      published,
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
      posts,
      errors,
    });
  } catch (err) {
    console.error('Cron error:', err);
    errors.push(err.message);
    return Response.json({
      success: false,
      requested,
      published,
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
      posts,
      errors,
    }, { status: 500 });
  }
}
