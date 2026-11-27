import { CustomerDetailTemplate } from '@/components/templates/customer-detail-template'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import {
  getAdminSettings,
  getCustomerDetail,
} from '@/infrastructure/db/admin-dashboard'
import { notFound } from 'next/navigation'
import { z } from 'zod'

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>
}

/**
 * Renders one customer and every card action.
 *
 * @param props - Dynamic route properties.
 * @param props.params - Untrusted customer route parameter.
 */
export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps): Promise<React.JSX.Element> {
  await requireAdmin()
  const parsed = z.uuid().safeParse((await params).id)
  if (!parsed.success) notFound()

  const [customer, settings] = await Promise.all([
    getCustomerDetail(parsed.data),
    getAdminSettings(),
  ])
  if (!customer || !settings) notFound()

  return (
    <CustomerDetailTemplate
      customer={customer}
      goal={settings.stampsRequired}
    />
  )
}
