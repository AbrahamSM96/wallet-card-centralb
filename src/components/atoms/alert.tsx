import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type AlertProps = {
  children: ReactNode
  tone: 'error' | 'success'
}

/**
 * Renders an accessible mutation result message.
 *
 * @param props - Alert content and tone.
 * @param props.children - Message body.
 * @param props.tone - Success or error presentation.
 */
export function Alert({ children, tone }: AlertProps): React.JSX.Element {
  return (
    <p
      className={cn(
        'rounded-lg px-3 py-2 text-sm',
        tone === 'error'
          ? 'bg-red-50 text-red-800'
          : 'bg-emerald-50 text-emerald-800'
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}
