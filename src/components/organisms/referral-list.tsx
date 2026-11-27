import { Badge } from '@/components/atoms/badge'
import type { ReferralSummary } from '@/infrastructure/db/admin-dashboard'

type ReferralListProps = {
  referrals: ReferralSummary[]
}

/**
 * Lists referral relationships and reward outcomes.
 *
 * @param props - Referral records.
 * @param props.referrals - Recent referral summaries.
 */
export function ReferralList({
  referrals,
}: ReferralListProps): React.JSX.Element {
  if (referrals.length === 0) {
    return <p className="text-cacao">Aún no hay referidos.</p>
  }

  return (
    <div className="grid gap-3">
      {referrals.map((referral) => (
        <article
          className="rounded-[20px] border border-cacao/20 bg-white p-4"
          key={referral.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{referral.referredName}</h2>
              <p className="text-sm text-cacao">
                Invitado por {referral.referrerPublicCode}
              </p>
            </div>
            <Badge
              tone={
                referral.rewardSkippedReason
                  ? 'red'
                  : referral.rewardedAt
                    ? 'green'
                    : 'amber'
              }
            >
              {referral.rewardSkippedReason
                ? 'Sin bono'
                : referral.rewardedAt
                  ? 'Bono entregado'
                  : 'Pendiente'}
            </Badge>
          </div>
        </article>
      ))}
    </div>
  )
}
