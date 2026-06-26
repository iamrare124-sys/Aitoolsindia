import config from '../config/site.config.js';

export async function fetchImage(keyword) {
  // Try Pexels first
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const query = encodeURIComponent(keyword || config.imageKeywords[0]);
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=landscape`,
        { headers: { Authorization: pexelsKey }, signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        const photos = data.photos || [];
        if (photos.length > 0) {
          const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 3))];
          return {
            url: photo.src.large2x || photo.src.large,
            alt: photo.alt || keyword,
            credit: `Photo by ${photo.photographer} on Pexels`,
          };
        }
      }
    } catch (err) {
      console.error('Pexels fetch error:', err.message);
    }
  }

  // Try Unsplash
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const query = encodeURIComponent(keyword || config.imageKeywords[0]);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=5&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` }, signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        if (results.length > 0) {
          const photo = results[Math.floor(Math.random() * Math.min(results.length, 3))];
          return {
            url: photo.urls.regular,
            alt: photo.alt_description || keyword,
            credit: `Photo by ${photo.user.name} on Unsplash`,
          };
        }
      }
    } catch (err) {
      console.error('Unsplash fetch error:', err.message);
    }
  }

  // Fallback to placeholder
  const kw = encodeURIComponent(keyword || 'artificial intelligence');
  return {
    url: `https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80`,
    alt: keyword || 'AI Technology',
    credit: 'Unsplash',
  };
}

export async function fetchImageForPost(title, category) {
  const catKeywords = {
    'ai-news': 'artificial intelligence technology news',
    'chatgpt-guides': 'AI chatbot conversation computer',
    'free-ai-tools': 'AI software tools laptop',
    'ai-for-work': 'professional working technology office india',
  };
  const keyword = catKeywords[category] || config.imageKeywords[0];
  return fetchImage(keyword);
}
