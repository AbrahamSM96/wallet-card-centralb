import { Label as LabelPrimitive } from '@/components/ui/label'
import type { ComponentProps } from 'react'

type LabelProps = ComponentProps<typeof LabelPrimitive>

/**
 * Exposes the shadcn label primitive as an application atom.
 *
 * @param props - Label properties.
 */
export function Label(props: LabelProps): React.JSX.Element {
  return <LabelPrimitive {...props} />
}
