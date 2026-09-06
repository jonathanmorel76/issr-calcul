import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import AppUtilityMenu from '@/components/app-utility-menu'
import RateRangeDisplayFix from '@/components/rate-range-display-fix'
import WidgetCustomizerSync from '@/components/widget-customizer-sync'
import GeolocatedAutocomplete from '@/components/geolocated-autocomplete'
import './design-system.css'
import './globals.css'
import './dashboard.css'
import './widgets.css'
import './brand.css'
import './app-menu.css'
import './profile.css'
import './icon-overrides.css'
import './mobile-field-fixes.css'
import './profile-mobile-fixes.css'
import './autocomplete.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-app' })

export const metadata: Metadata = {
  title: 'Mon Remplacement — Assistant des enseignants remplaçants',
  description: 'Mon Remplacement centralise les missions, établissements, déplacements, indemnités ISSR et outils utiles aux enseignants remplaçants.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={manrope.variable}><AppUtilityMenu/><RateRangeDisplayFix/><WidgetCustomizerSync/><GeolocatedAutocomplete/>{children}</body></html>
}
