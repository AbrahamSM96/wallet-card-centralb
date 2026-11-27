import { Badge } from '@/components/atoms/badge'
import type { CustomerDetail } from '@/infrastructure/db/admin-dashboard'

type CustomerActivityHistoryProps = {
  customer: CustomerDetail
}

/**
 * Displays stamp and redemption audit history.
 *
 * @param props - Customer ledger history.
 * @param props.customer - Customer detail with ledger entries.
 */
export function CustomerActivityHistory({
  customer,
}: CustomerActivityHistoryProps): React.JSX.Element {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold">Historial de sellos</h2>
        <div className="mt-4 space-y-3">
          {customer.stamps.length === 0 ? (
            <p className="text-sm text-stone-600">Aún no hay sellos.</p>
          ) : (
            customer.stamps.map((stamp) => (
              <div
                className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 last:border-0"
                key={stamp.id}
              >
                <div>
                  <p className="text-sm font-medium">
                    {stamp.orderNumber ?? stamp.note ?? 'Sello automático'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {stamp.createdAt.toLocaleString('es-MX')}
                  </p>
                </div>
                <Badge
                  tone={stamp.source === 'referral_bonus' ? 'amber' : 'stone'}
                >
                  {stamp.source === 'referral_bonus' ? 'Referido' : 'Pedido'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold">Canjes</h2>
        <div className="mt-4 space-y-3">
          {customer.redemptions.length === 0 ? (
            <p className="text-sm text-stone-600">Aún no hay canjes.</p>
          ) : (
            customer.redemptions.map((redemption) => (
              <div
                className="flex justify-between border-b border-stone-100 pb-3 last:border-0"
                key={redemption.id}
              >
                <span className="text-sm">{redemption.stampsUsed} sellos</span>
                <span className="text-xs text-stone-500">
                  {redemption.createdAt.toLocaleString('es-MX')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
