import { Input as InputPrimitive } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

export type InputProps = ComponentProps<typeof InputPrimitive>

/**
 * Applies application defaults to the shadcn input primitive.
 *
 * @param props - Input properties.
 * @param props.className - Optional classes appended to the defaults.
 */
export function Input({ className, ...props }: InputProps): React.JSX.Element {
  return (
    <InputPrimitive
      className={cn('focus-visible:ring-amber-800/30', className)}
      {...props}
    />
  )
}
