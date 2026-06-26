import config from '../../../config/site.config.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const key = process.env.INDEX_NOW_KEY;
  if (!key) return Response.json({ error: 'INDEX_NOW_KEY not set' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return Response.json({ error: 'url param required' }, { status: 400 });

  try {
    const body = {
      host: config.domain,
      key,
      keyLocation: `https://${config.domain}/${key}.txt`,
      urlList: [url],
    };

    const [bing, yandex] = await Promise.allSettled([
      fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ]);

    return Response.json({
      success: true,
      url,
      bing: bing.status === 'fulfilled' ? bing.value.status : 'failed',
      yandex: yandex.status === 'fulfilled' ? yandex.value.status : 'failed',
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
