import { timingSafeEqual } from 'node:crypto'

/**
 * Authorizes Vercel Cron using a constant-time Bearer comparison.
 *
 * @param authorization - Raw Authorization header.
 * @param expectedSecret - Configured cron secret.
 */
export function authorizeCronRequest(
  authorization: string | null,
  expectedSecret: string | undefined
): Response | null {
  if (!expectedSecret || !authorization?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supplied = Buffer.from(authorization.slice('Bearer '.length))
  const expected = Buffer.from(expectedSecret)
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
