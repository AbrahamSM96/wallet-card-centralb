import { env } from '@/config/env'
import { jwtVerify, SignJWT } from 'jose'

export const SESSION_COOKIE_NAME = 'central-brownies-session'
export const SESSION_DURATION_SECONDS = 60 * 60 * 8

type SessionPayload = {
  adminId: string
}

const sessionSecret = new TextEncoder().encode(env.SESSION_SECRET)

/**
 * Creates a signed, short-lived admin session token.
 *
 * @param adminId - Database identifier of the authenticated administrator.
 */
export async function createSessionToken(adminId: string): Promise<string> {
  return new SignJWT({ adminId })
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .setIssuedAt()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminId)
    .sign(sessionSecret)
}

/**
 * Returns the trusted session payload, or null for an invalid token.
 *
 * @param token - Encoded session token received from the cookie.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret, {
      algorithms: ['HS256'],
    })
    const adminId = payload.adminId

    return typeof adminId === 'string' ? { adminId } : null
  } catch {
    return null
  }
}
