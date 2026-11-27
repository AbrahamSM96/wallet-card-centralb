import { Checkbox as CheckboxPrimitive } from '@/components/ui/checkbox'
import type { ComponentProps } from 'react'

type CheckboxProps = Omit<ComponentProps<typeof CheckboxPrimitive>, 'type'>

/**
 * Exposes the checkbox primitive as an application atom.
 *
 * @param props - Checkbox properties.
 */
export function Checkbox(props: CheckboxProps): React.JSX.Element {
  return <CheckboxPrimitive {...props} />
}
