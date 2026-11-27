import { ClaimTemplate } from '@/components/templates/claim-template'
import { ClaimUnavailableTemplate } from '@/components/templates/claim-unavailable-template'
import { loyaltyService } from '@/infrastructure/loyalty-service'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { z } from 'zod'

type ClaimPageProps = {
  params: Promise<{ token: string }>
}

/**
 * Renders the wallet claim options without consuming the token.
 *
 * @param props - Dynamic claim route properties.
 * @param props.params - Untrusted claim token route parameter.
 */
export default async function ClaimPage({
  params,
}: ClaimPageProps): Promise<React.JSX.Element> {
  const token = (await params).token
  const parsed = z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/)
    .safeParse(token)
  if (!parsed.success) notFound()
  let privacyRequired: boolean
  try {
    privacyRequired = (await loyaltyService.getClaimContext(token))
      .privacyRequired
  } catch {
    return <ClaimUnavailableTemplate />
  }
  const userAgent = (await headers()).get('user-agent') ?? ''
  return (
    <ClaimTemplate
      isAndroid={/Android/i.test(userAgent)}
      isIOS={/iPhone|iPad|iPod/i.test(userAgent)}
      privacyRequired={privacyRequired}
      token={token}
    />
  )
}
