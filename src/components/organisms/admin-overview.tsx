import { ActionLink } from '@/components/atoms/action-link'
import { StatCard } from '@/components/molecules/stat-card'
import type { AdminCounts } from '@/infrastructure/db/admin-dashboard'

type AdminOverviewProps = {
  counts: AdminCounts
}

/**
 * Shows mobile dashboard metrics and the primary stamping entry point.
 *
 * @param props - Current panel metrics.
 * @param props.counts - Customer and card counts.
 */
export function AdminOverview({
  counts,
}: AdminOverviewProps): React.JSX.Element {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Clientes" value={counts.customers} />
        <StatCard label="Tarjetas vigentes" value={counts.activeCards} />
        <div className="col-span-2 sm:col-span-1">
          <StatCard label="Tarjetas flagged" value={counts.flaggedCards} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ActionLink className="min-h-14 text-base" href="/admin/clientes">
          Buscar cliente para sellar
        </ActionLink>
        <ActionLink
          className="min-h-14 text-base"
          href="/admin/clientes/nuevo"
          variant="secondary"
        >
          Crear cliente
        </ActionLink>
      </div>
    </div>
  )
}
