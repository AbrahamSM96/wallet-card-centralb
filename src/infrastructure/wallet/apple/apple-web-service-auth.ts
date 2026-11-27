import { timingSafeEqual } from 'node:crypto'

const AUTHORIZATION_PREFIX = 'ApplePass '

/**
 * Compares Apple's authorization token in constant time.
 *
 * @param authorization - Raw Authorization header.
 * @param expectedToken - Card authentication token.
 */
export function isApplePassAuthorized(
  authorization: string | null,
  expectedToken: string | null
): boolean {
  if (!authorization?.startsWith(AUTHORIZATION_PREFIX) || !expectedToken) {
    return false
  }
  const supplied = Buffer.from(authorization.slice(AUTHORIZATION_PREFIX.length))
  const expected = Buffer.from(expectedToken)
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  )
}

/** Returns Apple's required 401 response for an invalid pass token. */
export function appleUnauthorizedResponse(): Response {
  return new Response(null, { status: 401 })
}
