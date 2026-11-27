import { CustomerCreateTemplate } from '@/components/templates/customer-create-template'
import { requireAdmin } from '@/infrastructure/auth/require-admin'

/** Renders the customer registration workflow. */
export default async function NewCustomerPage(): Promise<React.JSX.Element> {
  await requireAdmin()
  return <CustomerCreateTemplate />
}
