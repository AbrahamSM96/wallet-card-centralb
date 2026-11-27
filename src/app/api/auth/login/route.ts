import { loginRateLimiter } from '@/infrastructure/auth/login-rate-limiter'
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/infrastructure/auth/session'
import { db } from '@/infrastructure/db/client'
import { admins } from '@/infrastructure/db/schema'
import { verify } from '@node-rs/argon2'
import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$XWUyQOHdHokLknLATKOupQ$EiS7A5Eo9t62Q1SYgzR/y5hncPiD1VPy7PqysAp/UDs'

type LoginErrorCode = 'invalid' | 'rate_limited'

/**
 * Authenticates an administrator and creates a signed cookie session.
 *
 * @param request - Incoming credential form request.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData()
  const credentials = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!credentials.success) return loginFailure(request)

  const email = credentials.data.email.trim().toLowerCase()
  const forwardedAddress = request.headers.get('x-forwarded-for') ?? 'unknown'
  const rateLimitKey = `${forwardedAddress}:${email}`

  if (!loginRateLimiter.consume(rateLimitKey)) {
    return loginFailure(request, 'rate_limited')
  }

  const admin = await db.query.admins.findFirst({
    where: eq(admins.email, email),
  })
  const validPassword = await verify(
    admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
    credentials.data.password
  )

  if (!admin || !validPassword) return loginFailure(request)

  loginRateLimiter.reset(rateLimitKey)

  const response = NextResponse.redirect(new URL('/admin', request.url), 303)
  response.cookies.set({
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    name: SESSION_COOKIE_NAME,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    value: await createSessionToken(admin.id),
  })
  return response
}

/**
 * Redirects back to login with a generic, URL-safe error.
 *
 * @param request - Request whose origin is used for the redirect.
 * @param code - Stable error code interpreted by the login page.
 */
function loginFailure(
  request: NextRequest,
  code: LoginErrorCode = 'invalid'
): NextResponse {
  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('error', code)
  return NextResponse.redirect(loginUrl, 303)
}
