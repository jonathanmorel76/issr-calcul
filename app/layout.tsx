import type { Metadata } from 'next'
import { Caveat, Nunito, Patrick_Hand } from 'next/font/google'
import './globals.css'
import './modern.css'
import './dashboard.css'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })
const patrick = Patrick_Hand({ subsets: ['latin'], weight: '400', variable: '--font-patrick' })

export const metadata: Metadata = {
  title: 'Mon Remplacement — Assistant des enseignants remplaçants',
  description: 'Mon Remplacement centralise les déplacements, indemnités ISSR et outils utiles aux enseignants remplaçants.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={`${nunito.variable} ${caveat.variable} ${patrick.variable}`}>{children}</body></html>
}
