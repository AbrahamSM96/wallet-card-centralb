import { SESSION_COOKIE_NAME } from '@/infrastructure/auth/session'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Removes the admin session and redirects to login.
 *
 * @param request - Request whose origin is used for the redirect.
 */
export function POST(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL('/admin/login', request.url),
    303
  )
  response.cookies.delete(SESSION_COOKIE_NAME)
  return response
}
