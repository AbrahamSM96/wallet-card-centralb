import { Button as ButtonPrimitive } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<typeof ButtonPrimitive>

/**
 * Applies the Central Brownies defaults to the shadcn button primitive.
 *
 * @param props - Button properties.
 * @param props.className - Optional classes appended to the brand defaults.
 */
export function Button({
  className,
  ...props
}: ButtonProps): React.JSX.Element {
  return <ButtonPrimitive className={cn('font-medium', className)} {...props} />
}
