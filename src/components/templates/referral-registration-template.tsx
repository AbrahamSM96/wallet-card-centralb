import { BrandMark } from '@/components/atoms/brand-mark'
import { StampStripPreview } from '@/components/molecules/stamp-strip-preview'
import { ReferralRegistrationForm } from '@/components/organisms/referral-registration-form'

type ReferralRegistrationTemplateProps = {
  goal: number
  referrerPublicCode: string
}

/**
 * Composes the public referred-customer registration page.
 *
 * @param props - Active referral code.
 * @param props.goal - Configured stamp goal.
 * @param props.referrerPublicCode - Referrer card code.
 */
export function ReferralRegistrationTemplate({
  goal,
  referrerPublicCode,
}: ReferralRegistrationTemplateProps): React.JSX.Element {
  return (
    <main className="min-h-screen bg-crema px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-7 text-center">
          <BrandMark />
          <h1 className="mt-5 text-2xl font-semibold">Tu tarjeta de lealtad</h1>
          <p className="mt-2 text-cacao">
            Completa tus datos para recibir tu propia tarjeta de sellos.
          </p>
          <div className="mt-5">
            <StampStripPreview goal={goal} stamps={0} />
          </div>
        </div>
        <section className="rounded-[24px] border border-cacao/20 bg-white p-6 shadow-sm">
          <ReferralRegistrationForm referrerPublicCode={referrerPublicCode} />
        </section>
      </div>
    </main>
  )
}
