import { siteConfig } from '@/config/site'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  description: siteConfig.description,
  title: siteConfig.name,
}

type RootLayoutProps = Readonly<{
  children: ReactNode
}>

/**
 * Provides the root HTML document shared by all routes.
 *
 * @param props - Root layout content.
 * @param props.children - Active route content.
 */
export default function RootLayout({
  children,
}: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
