import { BrandMark } from '@/components/atoms/brand-mark'
import { Button } from '@/components/atoms/button'
import { NavLink } from '@/components/atoms/nav-link'
import type { ReactNode } from 'react'

type AdminShellProps = {
  children: ReactNode
}

/**
 * Provides the shared, protected admin panel frame.
 *
 * @param props - Template content.
 * @param props.children - Protected page body.
 */
export function AdminShell({ children }: AdminShellProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-crema text-chocolate">
      <header className="border-b border-cacao/20 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandMark />
          <form action="/api/auth/logout" method="post">
            <Button
              className="text-cacao hover:text-chocolate"
              type="submit"
              variant="ghost"
            >
              Cerrar sesión
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          <NavLink href="/admin">Inicio</NavLink>
          <NavLink href="/admin/clientes">Clientes</NavLink>
          <NavLink href="/admin/referidos">Referidos</NavLink>
          <NavLink href="/admin/tarjetas-flagged">Flagged</NavLink>
          <NavLink href="/admin/configuracion">Configuración</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}
