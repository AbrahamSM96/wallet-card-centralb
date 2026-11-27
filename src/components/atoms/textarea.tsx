import { Textarea as TextareaPrimitive } from '@/components/ui/textarea'
import type { ComponentProps } from 'react'

export type TextareaProps = ComponentProps<typeof TextareaPrimitive>

/**
 * Exposes the shadcn textarea primitive as an application atom.
 *
 * @param props - Textarea properties.
 */
export function Textarea(props: TextareaProps): React.JSX.Element {
  return <TextareaPrimitive {...props} />
}
