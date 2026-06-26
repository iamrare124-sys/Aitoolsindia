export function verifyCronSecret(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // No secret = deny (not allow)

  // 1. Vercel automatic cron — Authorization: Bearer <secret>
  if (request.headers.get('authorization') === `Bearer ${secret}`) return true

  // 2. Manual trigger — ?secret=<secret>
  if (new URL(request.url).searchParams.get('secret') === secret) return true

  // 3. Legacy header
  if (request.headers.get('x-cron-secret') === secret) return true

  return false
}

export function verifyApiPassword(request) {
  const password = process.env.SITE_API_PASSWORD || process.env.CRON_SECRET
  if (!password) return false

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${password}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('password') === password) return true
  if (url.searchParams.get('secret') === password) return true  // also accept ?secret=

  return false
}

export function isValidUrl(str) {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}
