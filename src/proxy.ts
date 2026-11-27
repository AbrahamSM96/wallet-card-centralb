import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from '@/infrastructure/auth/session'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Protects admin routes while leaving the login page public.
 *
 * @param request - Incoming request for an admin route.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  if (session) return NextResponse.next()

  return NextResponse.redirect(new URL('/admin/login', request.url))
}

export const config = {
  matcher: ['/admin/:path*'],
}
