export function verifyCronSecret(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // No secret configured, allow all (dev mode)

  // Check Authorization Bearer header (Vercel auto-sends this)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  // Check ?secret= query param (manual trigger)
  const url = new URL(request.url);
  if (url.searchParams.get('secret') === secret) return true;

  // Check x-cron-secret header
  const cronHeader = request.headers.get('x-cron-secret');
  if (cronHeader === secret) return true;

  return false;
}

export function verifyApiPassword(request) {
  const password = process.env.SITE_API_PASSWORD;
  if (!password) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${password}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get('password') === password) return true;

  return false;
}

export function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
