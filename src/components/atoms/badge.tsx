import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  tone?: 'amber' | 'green' | 'red' | 'stone'
}

const toneClasses = {
  amber: 'bg-caramelo/20 text-chocolate',
  green: 'bg-emerald-100 text-emerald-900',
  red: 'bg-red-100 text-red-900',
  stone: 'bg-borde-pendiente/30 text-chocolate',
}

/**
 * Renders a compact status label.
 *
 * @param props - Badge content and visual tone.
 * @param props.children - Badge label.
 * @param props.tone - Semantic color tone.
 */
export function Badge({
  children,
  tone = 'stone',
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  )
}
