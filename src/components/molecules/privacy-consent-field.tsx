import { Checkbox } from '@/components/atoms/checkbox'
import { Label } from '@/components/atoms/label'
import Link from 'next/link'

type PrivacyConsentFieldProps = {
  id?: string
}

/**
 * Renders the mandatory privacy consent control with its policy link.
 *
 * @param props - Optional unique field identifier.
 * @param props.id - DOM identifier when multiple claim forms share a page.
 */
export function PrivacyConsentField({
  id = 'privacyAccepted',
}: PrivacyConsentFieldProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} name="privacyAccepted" required />
      <Label className="block leading-5" htmlFor={id}>
        Acepto el{' '}
        <Link className="underline" href="/privacidad" target="_blank">
          aviso de privacidad
        </Link>
        .
      </Label>
    </div>
  )
}
