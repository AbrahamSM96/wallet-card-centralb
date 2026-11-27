import { siteConfig } from '@/config/site'
import type { Metadata } from 'next'
import { Kaushan_Script, Nunito } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

const nunito = Nunito({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
})

const kaushanScript = Kaushan_Script({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-kaushan',
  weight: '400',
})

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: {
    apple: '/brand/apple-touch-icon.png',
    icon: '/brand/favicon.png',
  },
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
      <body className={`${nunito.variable} ${kaushanScript.variable}`}>
        {children}
      </body>
    </html>
  )
}
