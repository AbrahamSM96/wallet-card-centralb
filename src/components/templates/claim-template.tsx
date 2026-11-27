import { BrandMark } from '@/components/atoms/brand-mark'
import { StampStripPreview } from '@/components/molecules/stamp-strip-preview'
import { GoogleWalletClaim } from '@/components/organisms/google-wallet-claim'

type ClaimTemplateProps = {
  goal: number
  isAndroid: boolean
  isIOS: boolean
  privacyRequired: boolean
  stamps: number
  token: string
}

/**
 * Composes the public wallet claim experience.
 *
 * @param props - Device hint and one-time token.
 * @param props.goal - Configured reward goal.
 * @param props.isAndroid - Whether Android was detected.
 * @param props.isIOS - Whether iOS was detected.
 * @param props.privacyRequired - Whether the public claim needs consent.
 * @param props.stamps - Current stamp count.
 * @param props.token - Raw claim token from the route.
 */
export function ClaimTemplate({
  goal,
  isAndroid,
  isIOS,
  privacyRequired,
  stamps,
  token,
}: ClaimTemplateProps): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-crema px-5 py-10">
      <section className="w-full max-w-md rounded-[24px] border border-cacao/20 bg-white p-7 text-center shadow-sm">
        <BrandMark />
        <h1 className="mt-6 text-2xl font-semibold">Tu tarjeta está lista</h1>
        <p className="mt-3 text-cacao">
          Guarda tu tarjeta de sellos y llévala siempre contigo.
        </p>
        <div className="mt-6">
          <StampStripPreview goal={goal} stamps={stamps} />
        </div>
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
