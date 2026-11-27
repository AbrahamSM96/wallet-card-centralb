import Link from 'next/link'
import type { ReactNode } from 'react'

type NavLinkProps = {
  children: ReactNode
  href: string
}

/**
 * Renders a compact admin navigation link.
 *
 * @param props - Link destination and label.
 * @param props.children - Visible label.
 * @param props.href - Internal destination.
 */
export function NavLink({ children, href }: NavLinkProps): React.JSX.Element {
  return (
    <Link
      className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950"
      href={href}
    >
      {children}
    </Link>
  )
}
