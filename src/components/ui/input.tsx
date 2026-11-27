import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from 'cn'
import type { ComponentProps } from 'react'

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <InputPrimitive
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  )
}

export { Input }
