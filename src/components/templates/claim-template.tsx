import { BrandMark } from '@/components/atoms/brand-mark'
import { GoogleWalletClaim } from '@/components/organisms/google-wallet-claim'

type ClaimTemplateProps = {
  isAndroid: boolean
  isIOS: boolean
  privacyRequired: boolean
  token: string
}

/**
 * Composes the public wallet claim experience.
 *
 * @param props - Device hint and one-time token.
 * @param props.isAndroid - Whether Android was detected.
 * @param props.isIOS - Whether iOS was detected.
 * @param props.privacyRequired - Whether the public claim needs consent.
 * @param props.token - Raw claim token from the route.
 */
export function ClaimTemplate({
  isAndroid,
  isIOS,
  privacyRequired,
  token,
}: ClaimTemplateProps): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-sm">
        <BrandMark />
        <h1 className="mt-6 text-2xl font-semibold">Tu tarjeta está lista</h1>
        <p className="mt-3 text-stone-600">
          Guarda tu tarjeta de sellos y llévala siempre contigo.
        </p>
        <GoogleWalletClaim
          isAndroid={isAndroid}
          isIOS={isIOS}
          privacyRequired={privacyRequired}
          token={token}
        />
      </section>
    </main>
  )
}
