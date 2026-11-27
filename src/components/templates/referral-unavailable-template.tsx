import { BrandMark } from '@/components/atoms/brand-mark'

/** Shows a friendly message for missing or inactive referral codes. */
export function ReferralUnavailableTemplate(): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-5">
      <section className="max-w-md rounded-2xl border border-stone-200 bg-white p-7 text-center">
        <BrandMark />
        <h1 className="mt-5 text-2xl font-semibold">
          Invitación no disponible
        </h1>
        <p className="mt-3 text-stone-600">
          Este código no existe o la tarjeta que invitó ya no está activa.
        </p>
      </section>
    </main>
  )
}
