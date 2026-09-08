'use client'

import BilansView from '@/components/bilans-view'
import PremiumFeatureJourney from '@/components/premium-feature-journey'
import useBetaProductMode from '@/components/use-beta-product-mode'

export default function BilansAccessView({userId}:{userId:string}){
 const premium=useBetaProductMode()==='premium'
 if(premium)return <BilansView userId={userId}/>
 return <main className="dashboard-main reports-page">
  <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Mes bilans</span><h2>Le suivi courant reste gratuit</h2></div><span className="tag">Premium</span></div><p>Le tableau de bord et le suivi du mois en cours restent disponibles sans abonnement. La vue Bilans permet ensuite de consolider l’année scolaire, comparer les périodes et produire des exports.</p></section>
  <PremiumFeatureJourney
   eyebrow="Vision annuelle"
   title="Passez du suivi mensuel à une vision annuelle"
   description="Regroupez toute votre année scolaire pour mieux comprendre votre activité et conserver une synthèse exploitable."
   steps={[
    {title:'Voir toute l’année scolaire',detail:'Naviguez entre les mois et consolidez vos journées, distances et indemnités.'},
    {title:'Analyser vos remplacements',detail:'Repérez les établissements les plus fréquents et les périodes les plus importantes.'},
    {title:'Exporter vos bilans',detail:'Générez des synthèses PDF et Excel prêtes à conserver ou à transmettre.'},
   ]}
  />
 </main>
}
