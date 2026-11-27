import { cn } from 'cn'
import type { ComponentProps } from 'react'

function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none',
        className
      )}
      data-slot="label"
      {...props}
    />
  )
}

export { Label }
