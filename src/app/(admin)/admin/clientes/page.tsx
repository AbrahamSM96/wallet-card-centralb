import { CustomerListTemplate } from '@/components/templates/customer-list-template'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import { searchCustomers } from '@/infrastructure/db/admin-dashboard'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().trim().max(100).catch(''),
})

type CustomersPageProps = {
  searchParams: Promise<{ q?: string }>
}

/**
 * Renders customer search and results.
 *
 * @param props - Next.js search parameters.
 * @param props.searchParams - Untrusted URL search parameters.
 */
export default async function CustomersPage({
  searchParams,
}: CustomersPageProps): Promise<React.JSX.Element> {
  await requireAdmin()
  const params = await searchParams
  const { q } = searchSchema.parse({ q: params.q ?? '' })
  const customers = await searchCustomers(q)
  return <CustomerListTemplate customers={customers} query={q} />
}
