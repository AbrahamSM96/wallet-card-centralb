import { PageHeader } from '@/components/molecules/page-header'
import { AdminOverview } from '@/components/organisms/admin-overview'
import type { AdminCounts } from '@/infrastructure/db/admin-dashboard'

type AdminDashboardTemplateProps = {
  counts: AdminCounts
}

/**
 * Composes the administrator landing page.
 *
 * @param props - Dashboard data.
 * @param props.counts - Current metrics.
 */
export function AdminDashboardTemplate({
  counts,
}: AdminDashboardTemplateProps): React.JSX.Element {
  return (
    <div className="space-y-7">
      <PageHeader
        description="Busca una tarjeta y agrega sellos desde el celular."
        eyebrow="Panel"
        title="Central Brownies"
      />
      <AdminOverview counts={counts} />
    </div>
  )
}
