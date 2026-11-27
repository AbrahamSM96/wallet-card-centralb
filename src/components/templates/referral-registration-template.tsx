import { BrandMark } from '@/components/atoms/brand-mark'
import { ReferralRegistrationForm } from '@/components/organisms/referral-registration-form'

type ReferralRegistrationTemplateProps = {
  referrerPublicCode: string
}

/**
 * Composes the public referred-customer registration page.
 *
 * @param props - Active referral code.
 * @param props.referrerPublicCode - Referrer card code.
 */
export function ReferralRegistrationTemplate({
  referrerPublicCode,
}: ReferralRegistrationTemplateProps): React.JSX.Element {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-7 text-center">
          <BrandMark />
          <h1 className="mt-5 text-2xl font-semibold">Tu tarjeta de lealtad</h1>
          <p className="mt-2 text-stone-600">
            Completa tus datos para recibir tu propia tarjeta de sellos.
          </p>
        </div>
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <ReferralRegistrationForm referrerPublicCode={referrerPublicCode} />
        </section>
      </div>
    </main>
  )
}
