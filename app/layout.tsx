import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import AppUtilityMenu from '@/components/app-utility-menu'
import RateRangeDisplayFix from '@/components/rate-range-display-fix'
import WidgetCustomizerSync from '@/components/widget-customizer-sync'
import GeolocatedAutocomplete from '@/components/geolocated-autocomplete'
import MissionWeekdayPrefilter from '@/components/mission-weekday-prefilter'
import ActiveTabCentering from '@/components/active-tab-centering'
import IndemnityMonthFilterPosition from '@/components/indemnity-month-filter-position'
import DashboardViewNavigation from '@/components/dashboard-view-navigation'
import HeroArtworkHydrator from '@/components/hero-artwork-hydrator'
import MobileAppDock from '@/components/mobile-app-dock'
import MobilePremiumPreview from '@/components/mobile-premium-preview'
import PremiumSubscriptionRouter from '@/components/premium-subscription-router'
import IndemnityReconciliationBeta from '@/components/indemnity-reconciliation-beta'
import PremiumPaymentOverviewBeta from '@/components/premium-payment-overview-beta'
import PremiumOperationalInsightsBeta from '@/components/premium-operational-insights-beta'
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
import './mission-weekday-prefilter.css'
import './indemnity-period-fix.css'
import './secondary-views.css'
import './hero-school-patterns.css'
import './mobile-beta.css'
import './mobile-premium.css'
import './indemnity-reconciliation-beta.css'
import './premium-payment-overview-beta.css'
import './premium-operational-insights-beta.css'
import './premium-journey.css'
import './mobile-final-polish.css'
import './beta-mobile-corrections.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-app' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#103e43',
}

export const metadata: Metadata = {
  title: 'Mon Remplacement Beta — Assistant des enseignants remplaçants',
  description: 'Mon Remplacement centralise les missions, établissements, déplacements, indemnités ISSR et outils utiles aux enseignants remplaçants.',
  applicationName: 'Mon Remplacement Beta',
  appleWebApp: {
    capable: true,
    title: 'Mon Remplacement Beta',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={manrope.variable}><AppUtilityMenu/><RateRangeDisplayFix/><WidgetCustomizerSync/><GeolocatedAutocomplete/><MissionWeekdayPrefilter/><ActiveTabCentering/><IndemnityMonthFilterPosition/><DashboardViewNavigation/><HeroArtworkHydrator/><MobileAppDock/><MobilePremiumPreview/><PremiumSubscriptionRouter/><IndemnityReconciliationBeta/><PremiumPaymentOverviewBeta/><PremiumOperationalInsightsBeta/>{children}</body></html>
}
