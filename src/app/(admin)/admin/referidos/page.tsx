import { ReferralListTemplate } from '@/components/templates/referral-list-template'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import { listReferrals } from '@/infrastructure/db/admin-dashboard'

/** Renders referral status and reward outcomes. */
export default async function ReferralsPage(): Promise<React.JSX.Element> {
  await requireAdmin()
  const referrals = await listReferrals()
  return <ReferralListTemplate referrals={referrals} />
}
