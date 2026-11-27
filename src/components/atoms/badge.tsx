import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  tone?: 'amber' | 'green' | 'red' | 'stone'
}

const toneClasses = {
  amber: 'bg-amber-100 text-amber-900',
  green: 'bg-emerald-100 text-emerald-900',
  red: 'bg-red-100 text-red-900',
  stone: 'bg-stone-200 text-stone-800',
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
