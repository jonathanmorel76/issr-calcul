import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './design-system.css'
import './globals.css'
import './dashboard.css'
import './brand.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-app' })

export const metadata: Metadata = {
  title: 'Mon Remplacement — Assistant des enseignants remplaçants',
  description: 'Mon Remplacement centralise les missions, établissements, déplacements, indemnités ISSR et outils utiles aux enseignants remplaçants.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={manrope.variable}>{children}</body></html>
}
