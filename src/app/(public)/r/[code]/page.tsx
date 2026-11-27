import { ReferralRegistrationTemplate } from '@/components/templates/referral-registration-template'
import { ReferralUnavailableTemplate } from '@/components/templates/referral-unavailable-template'
import { hasActiveReferralCard } from '@/infrastructure/db/public-referrals'
import { z } from 'zod'

type ReferralPageProps = {
  params: Promise<{ code: string }>
}

/**
 * Renders the referral form only for an active referrer card.
 *
 * @param props - Dynamic referral route values.
 * @param props.params - Untrusted public referral code.
 */
export default async function ReferralPage({
  params,
}: ReferralPageProps): Promise<React.JSX.Element> {
  const parsed = z
    .string()
    .toUpperCase()
    .regex(/^CB-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/)
    .safeParse((await params).code)
  if (!parsed.success || !(await hasActiveReferralCard(parsed.data))) {
    return <ReferralUnavailableTemplate />
  }
  return <ReferralRegistrationTemplate referrerPublicCode={parsed.data} />
}
