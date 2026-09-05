import type { Metadata } from 'next'
import { Caveat, Nunito, Patrick_Hand } from 'next/font/google'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })
const patrick = Patrick_Hand({ subsets: ['latin'], weight: '400', variable: '--font-patrick' })

export const metadata: Metadata = {
  title: 'Calcul ISSR — Enseignant 1er degré',
  description: 'Calcul, suivi et export des ISSR pour les enseignants du premier degré.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={`${nunito.variable} ${caveat.variable} ${patrick.variable}`}>{children}</body></html>
}
