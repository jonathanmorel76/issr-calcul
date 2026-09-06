import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import AppUtilityMenu from '@/components/app-utility-menu'
import './design-system.css'
import './globals.css'
import './dashboard.css'
import './widgets.css'
import './brand.css'
import './app-menu.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-app' })

export const metadata: Metadata = {
  title: 'Mon Remplacement — Assistant des enseignants remplaçants',
  description: 'Mon Remplacement centralise les missions, établissements, déplacements, indemnités ISSR et outils utiles aux enseignants remplaçants.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={manrope.variable}><AppUtilityMenu/>{children}</body></html>
}
