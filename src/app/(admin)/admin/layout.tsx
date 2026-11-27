import { AdminShell } from '@/components/templates/admin-shell'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import type { ReactNode } from 'react'

type AdminLayoutProps = {
  children: ReactNode
}

/**
 * Wraps protected admin pages in the shared panel layout.
 *
 * @param props - Layout content.
 * @param props.children - Protected admin page.
 */
export default async function AdminLayout({
  children,
}: AdminLayoutProps): Promise<React.JSX.Element> {
  await requireAdmin()

  return <AdminShell>{children}</AdminShell>
}
