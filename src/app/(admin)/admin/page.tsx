import { AdminDashboardTemplate } from '@/components/templates/admin-dashboard-template'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import { getAdminCounts } from '@/infrastructure/db/admin-dashboard'

/** Renders the mobile-first administrator dashboard. */
export default async function AdminPage(): Promise<React.JSX.Element> {
  await requireAdmin()
  const counts = await getAdminCounts()
  return <AdminDashboardTemplate counts={counts} />
}
