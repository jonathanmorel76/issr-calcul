'use client'

import DocumentsView from '@/components/documents-view'
import PremiumFeatureJourney from '@/components/premium-feature-journey'
import useBetaProductMode from '@/components/use-beta-product-mode'

export default function DocumentsAccessView({userId}:{userId:string}){
 const premium=useBetaProductMode()==='premium'
 return <>
  <DocumentsView userId={userId}/>
  {!premium&&<main className="dashboard-main documents-page" style={{paddingTop:0}}><PremiumFeatureJourney
   eyebrow="Archive complète"
   title="Au-delà des 5 documents gratuits"
   description="La formule gratuite conserve vos pièces essentielles. Vous pouvez ensuite transformer la bibliothèque en véritable archive de suivi de remplacement."
   steps={[
    {title:'Archiver sans limite',detail:'Conservez vos arrêtés, attestations, emplois du temps, justificatifs et fiches de paie sur toute l’année.'},
    {title:'Relier les pièces aux missions',detail:'Associez chaque document au remplacement concerné pour retrouver immédiatement le bon justificatif.'},
    {title:'Alimenter le contrôle de paie',detail:'Les fiches de paie peuvent ensuite être analysées et rapprochées de vos droits ISSR.'},
   ]}
  /></main>}
 </>
}
