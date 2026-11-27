import { Badge } from '@/components/atoms/badge'
import { StampProgress } from '@/components/molecules/stamp-progress'
import type { CustomerDetail } from '@/infrastructure/db/admin-dashboard'
import { formatMexicanPhone } from '@/lib/claim-delivery'

type CustomerCardSummaryProps = {
  customer: CustomerDetail
  goal: number
}

/**
 * Shows customer identity, card state, and stamp progress.
 *
 * @param props - Customer and configured goal.
 * @param props.customer - Customer detail.
 * @param props.goal - Redemption threshold.
 */
export function CustomerCardSummary({
  customer,
  goal,
}: CustomerCardSummaryProps): React.JSX.Element {
  return (
    <section className="space-y-5 rounded-[24px] border border-cacao/20 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{customer.name}</h2>
          <p className="mt-1 text-sm text-cacao">
            {formatMexicanPhone(customer.phone)}
          </p>
          {customer.email ? (
            <p className="text-sm text-cacao">{customer.email}</p>
          ) : null}
        </div>
        {customer.card ? (
          <Badge tone={customer.card.status === 'flagged' ? 'red' : 'green'}>
            {customer.card.publicCode}
          </Badge>
        ) : (
          <Badge>Sin tarjeta vigente</Badge>
        )}
      </div>
      {customer.card ? (
        <StampProgress count={customer.card.stampCount} goal={goal} />
      ) : null}
      {customer.appleDevices.length > 0 ? (
        <div className="rounded-lg bg-crema p-3">
          <p className="text-sm font-medium">
            {customer.appleDevices.length}{' '}
            {customer.appleDevices.length === 1
              ? 'dispositivo Apple'
              : 'dispositivos Apple'}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-cacao">
            {customer.appleDevices.map((device) => (
              <li key={device.deviceLibraryId}>
                {device.deviceLibraryId.slice(0, 8)}… · desde{' '}
                {device.createdAt.toLocaleDateString('es-MX')}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
