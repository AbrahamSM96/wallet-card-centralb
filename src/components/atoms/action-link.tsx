import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { ReactNode } from 'react'

type ActionLinkProps = {
  children: ReactNode
  className?: string
  external?: boolean
  href: string
  variant?: 'primary' | 'secondary'
}

/**
 * Renders an internal or external link with button styling.
 *
 * @param props - Link destination and presentation.
 * @param props.children - Visible link label.
 * @param props.className - Optional additional classes.
 * @param props.external - Whether to render a plain external anchor.
 * @param props.href - Link destination.
 * @param props.variant - Visual treatment.
 */
export function ActionLink({
  children,
  className,
  external = false,
  href,
  variant = 'primary',
}: ActionLinkProps): React.JSX.Element {
  const styles = cn(
    'inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium',
    variant === 'primary'
      ? 'bg-amber-900 text-white hover:bg-amber-800'
      : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
    className
  )

  return external ? (
    <a href={href} className={styles} rel="noreferrer" target="_blank">
      {children}
    </a>
  ) : (
    <Link className={styles} href={href}>
      {children}
    </Link>
  )
}
