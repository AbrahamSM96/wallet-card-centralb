import { ActionLink } from '@/components/atoms/action-link'
import { CustomerSearch } from '@/components/molecules/customer-search'
import { PageHeader } from '@/components/molecules/page-header'
import { CustomerTable } from '@/components/organisms/customer-table'
import type { CustomerSummary } from '@/infrastructure/db/admin-dashboard'

type CustomerListTemplateProps = {
  customers: CustomerSummary[]
  query: string
}

/**
 * Composes customer search, results, and creation entry point.
 *
 * @param props - Search query and results.
 * @param props.customers - Matching customers.
 * @param props.query - Current search query.
 */
export function CustomerListTemplate({
  customers,
  query,
}: CustomerListTemplateProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <ActionLink href="/admin/clientes/nuevo">Nuevo cliente</ActionLink>
        }
        description="Busca por nombre, celular o código CB-XXXX."
        title="Clientes"
      />
      <CustomerSearch defaultValue={query} />
      <CustomerTable customers={customers} />
    </div>
  )
}
