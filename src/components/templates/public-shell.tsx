import { BrandMark } from '@/components/atoms/brand-mark'
import type { ReactNode } from 'react'

type PublicShellProps = {
  children: ReactNode
}

/**
 * Provides the centered frame used by public pages.
 *
 * @param props - Template content.
 * @param props.children - Public page body.
 */
export function PublicShell({ children }: PublicShellProps): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-crema px-6 py-12 text-chocolate">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandMark />
        </div>
        {children}
      </div>
    </main>
  )
}
