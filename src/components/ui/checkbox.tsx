import { cn } from 'cn'
import type { ComponentProps } from 'react'

function Checkbox({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'size-4 rounded border-input accent-noche focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      data-slot="checkbox"
      type="checkbox"
      {...props}
    />
  )
}

export { Checkbox }
