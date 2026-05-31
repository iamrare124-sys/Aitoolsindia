import config from '../config/site.config.js'

const MAX_AGE = 48 * 60 * 60 * 1000 // 48 hours in ms

function isRecent(pubDate) {
  const age = Date.now() - new Date(pubDate || new Date()).getTime()
  return age < MAX_AGE && age > 0
}

function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, '').trim()
}

// ─── SOURCE 1: Google News RSS ─────────────────────────────────────────────
async function fetchGoogleNews(rssUrl) {
  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SyndicateHubBot/1.0)' },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1]
      const title = stripHtml(
        (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
         item.match(/<title>(.*?)<\/title>/))?.[1] || ''
      )
      const link = (
        item.match(/<link>(.*?)<\/link>/) ||
        item.match(/<guid[^>]*>(.*?)<\/guid>/)
      )?.[1] || ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      const description = stripHtml(
        (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
         item.match(/<description>(.*?)<\/description>/))?.[1] || ''
      ).substring(0, 400)
      const source = stripHtml(item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News')

      if (title && isRecent(pubDate)) {
        items.push({
          title,
          link,
          pubDate,
          description,
          source,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          timestamp: new Date(pubDate).getTime(),
        })
      }
    }
    return items
  } catch (err) {
    console.error('fetchGoogleNews error:', err.message)
    return []
  }
}

// ─── SOURCE 2: Bing News RSS ──────────────────────────────────────────────
async function fetchBing() {
  const keywords = [
    config.keywords?.primary || 'AI tools india',
    ...(config.keywords?.secondary || []).slice(0, 2),
  ]
  const items = []
  for (const kw of keywords.slice(0, 2)) {
    try {
      const q = encodeURIComponent(kw)
      const url = `https://www.bing.com/news/search?q=${q}&format=RSS`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SyndicateHubBot/1.0)' },
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 0 },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      let match
      while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1]
        const title = stripHtml(
          (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
           item.match(/<title>(.*?)<\/title>/))?.[1] || ''
        )
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        const description = stripHtml(
          (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
           item.match(/<description>(.*?)<\/description>/))?.[1] || ''
        ).substring(0, 400)

        if (title && isRecent(pubDate)) {
          items.push({
            title,
            link,
            pubDate,
            description,
            source: 'Bing News',
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            timestamp: new Date(pubDate).getTime(),
          })
        }
      }
    } catch (err) {
      console.error('fetchBing error:', err.message)
    }
  }
  return items
}

// ─── SOURCE 3: Reddit JSON ────────────────────────────────────────────────
async function fetchReddit(subreddits) {
  const items = []
  for (const sub of (subreddits || []).slice(0, 2)) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
        {
          headers: { 'User-Agent': 'SyndicateHub/1.0 news aggregator' },
          signal: AbortSignal.timeout(8000),
          next: { revalidate: 0 },
        }
      )
      if (!res.ok) continue
      const json = await res.json()
      const posts = json?.data?.children || []
      const fresh = posts.filter(p => {
        const age = Date.now() - p.data.created_utc * 1000
        return age < 24 * 60 * 60 * 1000 && !p.data.stickied
      })
      items.push(
        ...fresh.slice(0, 3).map(p => ({
          title: p.data.title,
          link: `https://reddit.com${p.data.permalink}`,
          pubDate: new Date(p.data.created_utc * 1000).toISOString(),
          description: (p.data.selftext || p.data.title).slice(0, 400),
          source: `r/${sub}`,
          publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
          timestamp: p.data.created_utc * 1000,
        }))
      )
    } catch (err) {
      console.error(`Reddit r/${sub} failed:`, err.message)
    }
  }
  return items
}

// ─── SOURCE 4: Yahoo Finance / News RSS ──────────────────────────────────
async function fetchYahoo() {
  const queries = [
    config.keywords?.primary || 'AI tools india',
    'artificial intelligence india',
  ]
  const items = []
  for (const q of queries.slice(0, 2)) {
    try {
      const encoded = encodeURIComponent(q)
      const url = `https://news.search.yahoo.com/rss?p=${encoded}&ei=UTF-8`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SyndicateHubBot/1.0)' },
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 0 },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      let match
      while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1]
        const title = stripHtml(
          (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
           item.match(/<title>(.*?)<\/title>/))?.[1] || ''
        )
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        const description = stripHtml(
          (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
           item.match(/<description>(.*?)<\/description>/))?.[1] || ''
        ).substring(0, 400)

        if (title && isRecent(pubDate)) {
          items.push({
            title,
            link,
            pubDate,
            description,
            source: 'Yahoo News',
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            timestamp: new Date(pubDate).getTime(),
          })
        }
      }
    } catch (err) {
      console.error('fetchYahoo error:', err.message)
    }
  }
  return items
}

// ─── DEDUP ────────────────────────────────────────────────────────────────
function dedup(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.title.substring(0, 60).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── FETCH ALL 4 SOURCES ─────────────────────────────────────────────────
export async function fetchAllSources() {
  const rssUrls = config.rss || []
  const googlePromises = rssUrls.map(url => fetchGoogleNews(url))

  const results = await Promise.allSettled([
    ...googlePromises,
    fetchBing(),
    fetchReddit(config.reddit || []),
    fetchYahoo(),
  ])

  let allItems = []
  for (const result of results) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allItems = allItems.concat(result.value)
    }
  }

  allItems = dedup(allItems)
  allItems.sort((a, b) => b.timestamp - a.timestamp)
  return allItems
}

// ─── SELECT BEST STORY ────────────────────────────────────────────────────
export function selectBestStory(items, usedTitles = []) {
  if (!items.length) return null

  const keywords = [
    ...(config.keywords?.primary || '').split(' '),
    ...(config.keywords?.secondary || []).flatMap(k => k.split(' ')),
  ].map(k => k.toLowerCase()).filter(k => k.length >= 3)

  const usedSet = new Set(usedTitles.map(t => t.substring(0, 60).toLowerCase()))

  const scored = items
    .filter(item => !usedSet.has(item.title.substring(0, 60).toLowerCase()))
    .map(item => {
      let score = 0
      const titleLower = item.title.toLowerCase()
      const descLower = (item.description || '').toLowerCase()

      for (const kw of keywords) {
        if (titleLower.includes(kw)) score += 3
        if (descLower.includes(kw)) score += 1
      }

      const ageHours = (Date.now() - item.timestamp) / (1000 * 60 * 60)
      if (ageHours < 6) score += 5
      else if (ageHours < 12) score += 3
      else if (ageHours < 24) score += 2
      else if (ageHours < 48) score += 1

      return { ...item, score }
    })

  if (!scored.length) return null
  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}
