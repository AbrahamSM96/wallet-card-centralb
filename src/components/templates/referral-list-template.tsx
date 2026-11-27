import { PageHeader } from '@/components/molecules/page-header'
import { ReferralList } from '@/components/organisms/referral-list'
import type { ReferralSummary } from '@/infrastructure/db/admin-dashboard'

type ReferralListTemplateProps = {
  referrals: ReferralSummary[]
}

/**
 * Composes the referral audit page.
 *
 * @param props - Referral summaries.
 * @param props.referrals - Referral records.
 */
export function ReferralListTemplate({
  referrals,
}: ReferralListTemplateProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Consulta invitaciones, bonos entregados y bonos omitidos."
        title="Referidos"
      />
      <ReferralList referrals={referrals} />
    </div>
  )
}
