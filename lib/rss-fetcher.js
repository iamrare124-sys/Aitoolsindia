import config from '../config/site.config.js';

const MAX_AGE = 48 * 60 * 60 * 1000; // 48 hours in ms

function parseRSSDate(dateStr) {
  if (!dateStr) return new Date(0);
  try { return new Date(dateStr); } catch { return new Date(0); }
}

function isRecent(pubDate) {
  const age = Date.now() - new Date(pubDate).getTime();
  return age < MAX_AGE;
}

async function fetchGoogleNews(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     item.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link = (item.match(/<link>(.*?)<\/link>/) ||
                    item.match(/<guid[^>]*>(.*?)<\/guid>/))?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                           item.match(/<description>(.*?)<\/description>/))?.[1] || '';
      const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News';
      if (title && isRecent(pubDate)) {
        items.push({
          title: title.replace(/<[^>]+>/g, '').trim(),
          link,
          pubDate,
          description: description.replace(/<[^>]+>/g, '').substring(0, 200),
          source,
          timestamp: new Date(pubDate).getTime(),
        });
      }
    }
    return items;
  } catch (err) {
    console.error('fetchGoogleNews error:', err.message);
    return [];
  }
}

async function fetchRedditJSON(subreddits) {
  const items = [];
  for (const sub of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=10`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AItoolsindiaBot/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const posts = data?.data?.children || [];
      for (const post of posts) {
        const p = post.data;
        if (!p.title || p.is_self === false) continue;
        const pubDate = new Date(p.created_utc * 1000).toISOString();
        if (!isRecent(pubDate)) continue;
        items.push({
          title: p.title,
          link: `https://reddit.com${p.permalink}`,
          pubDate,
          description: (p.selftext || '').substring(0, 200),
          source: `r/${sub}`,
          timestamp: p.created_utc * 1000,
        });
      }
    } catch (err) {
      console.error(`Reddit fetch error for r/${sub}:`, err.message);
    }
  }
  return items;
}

function deduplicateByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.title.substring(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchAllSources() {
  const rssPromises = config.rss.map((url) => fetchGoogleNews(url));
  const redditPromise = fetchRedditJSON(config.reddit || []);

  const results = await Promise.allSettled([...rssPromises, redditPromise]);
  let allItems = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems = allItems.concat(result.value);
    }
  }

  allItems = deduplicateByTitle(allItems);
  allItems.sort((a, b) => b.timestamp - a.timestamp);
  return allItems;
}

export function selectBestStory(items, usedTitles = []) {
  if (!items.length) return null;

  const keywords = [
    ...(config.keywords.primary || '').split(' '),
    ...(config.keywords.secondary || []).flatMap((k) => k.split(' ')),
  ].map((k) => k.toLowerCase());

  const usedSet = new Set(usedTitles.map((t) => t.substring(0, 60).toLowerCase()));

  const scored = items
    .filter((item) => !usedSet.has(item.title.substring(0, 60).toLowerCase()))
    .map((item) => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descLower = (item.description || '').toLowerCase();

      for (const kw of keywords) {
        if (kw.length < 3) continue;
        if (titleLower.includes(kw)) score += 3;
        if (descLower.includes(kw)) score += 1;
      }

      const ageHours = (Date.now() - item.timestamp) / (1000 * 60 * 60);
      if (ageHours < 6) score += 5;
      else if (ageHours < 12) score += 3;
      else if (ageHours < 24) score += 2;
      else if (ageHours < 48) score += 1;

      return { ...item, score };
    });

  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}
