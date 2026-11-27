import { PageHeader } from '@/components/molecules/page-header'
import { CustomerRegistrationForm } from '@/components/organisms/customer-registration-form'

/** Composes the customer registration page. */
export function CustomerCreateTemplate(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Crea al cliente, su tarjeta y el link de reclamo en un solo paso."
        title="Nuevo cliente"
      />
      <CustomerRegistrationForm />
    </div>
  )
}
