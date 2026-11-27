import { PageHeader } from '@/components/molecules/page-header'
import { CardManagementPanel } from '@/components/organisms/card-management-panel'
import { CustomerActivityHistory } from '@/components/organisms/customer-activity-history'
import { CustomerCardSummary } from '@/components/organisms/customer-card-summary'
import { RedeemForm } from '@/components/organisms/redeem-form'
import { ReissueClaimForm } from '@/components/organisms/reissue-claim-form'
import { StampForm } from '@/components/organisms/stamp-form'
import type { CustomerDetail } from '@/infrastructure/db/admin-dashboard'

type CustomerDetailTemplateProps = {
  customer: CustomerDetail
  goal: number
}

/**
 * Composes customer identity, stamp actions, claim tools, and audit history.
 *
 * @param props - Customer detail and loyalty goal.
 * @param props.customer - Customer and ledger data.
 * @param props.goal - Configured redemption threshold.
 */
export function CustomerDetailTemplate({
  customer,
  goal,
}: CustomerDetailTemplateProps): React.JSX.Element {
  const card = customer.card
  return (
    <div className="space-y-6">
      <PageHeader
        description="Agrega sellos, canjea premios y consulta movimientos."
        title="Detalle del cliente"
      />
      <CustomerCardSummary customer={customer} goal={goal} />
      {card ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Agregar sello</h2>
            <StampForm cardId={card.id} customerId={customer.id} />
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Canjear premio</h2>
            <RedeemForm
              cardId={card.id}
              customerId={customer.id}
              enabled={card.stampCount >= goal}
              goal={goal}
              remainder={Math.max(0, card.stampCount - goal)}
            />
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-2">
            <h2 className="mb-4 font-semibold">Link de reclamo</h2>
            <ReissueClaimForm cardId={card.id} customerId={customer.id} />
          </section>
        </div>
      ) : null}
      <CardManagementPanel
        cardId={card?.id ?? null}
        customerId={customer.id}
        platform={card?.platform ?? null}
        status={card?.status ?? null}
      />
      <CustomerActivityHistory customer={customer} />
    </div>
  )
}
