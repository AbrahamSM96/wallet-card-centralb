import { ActionLink } from '@/components/atoms/action-link'
import { Badge } from '@/components/atoms/badge'
import type { CustomerSummary } from '@/infrastructure/db/admin-dashboard'
import { formatMexicanPhone } from '@/lib/claim-delivery'

type CustomerTableProps = {
  customers: CustomerSummary[]
}

/**
 * Renders customer search results as touch-friendly cards.
 *
 * @param props - Search results.
 * @param props.customers - Matching customer summaries.
 */
export function CustomerTable({
  customers,
}: CustomerTableProps): React.JSX.Element {
  if (customers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-600">
        No encontramos clientes.
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      {customers.map((customer) => (
        <article
          className="rounded-xl border border-stone-200 bg-white p-4"
          key={customer.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{customer.name}</h2>
              <p className="mt-1 text-sm text-stone-600">
                {formatMexicanPhone(customer.phone)}
              </p>
            </div>
            <Badge tone={customer.status === 'flagged' ? 'red' : 'green'}>
              {customer.publicCode ?? 'Sin tarjeta'}
            </Badge>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{customer.stampCount} sellos</p>
            <ActionLink href={`/admin/clientes/${customer.id}`}>
              Ver y sellar
            </ActionLink>
          </div>
        </article>
      ))}
    </div>
  )
}
