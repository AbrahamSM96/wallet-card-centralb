import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from '@/infrastructure/auth/session'
import { db } from '@/infrastructure/db/client'
import { admins } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Requires a valid session backed by an existing administrator record.
 *
 * @returns The authenticated administrator.
 */
export async function requireAdmin(): Promise<typeof admins.$inferSelect> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  if (!session) redirect('/admin/login')

  const admin = await db.query.admins.findFirst({
    where: eq(admins.id, session.adminId),
  })

  if (!admin) redirect('/admin/login')

  return admin
}
