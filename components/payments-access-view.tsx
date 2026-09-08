'use client'

import PaymentsView from '@/components/payments-view'
import PremiumFeatureJourney from '@/components/premium-feature-journey'
import useBetaProductMode from '@/components/use-beta-product-mode'

export default function PaymentsAccessView({userId}:{userId:string}){
 const premium=useBetaProductMode()==='premium'
 if(premium)return <PaymentsView userId={userId}/>
 return <main className="dashboard-main reports-page payments-page">
  <section className="dashboard-panel report-panel">
   <div className="report-head"><div><span className="eyebrow">Suivi de paie · Premium</span><h2>Vérifiez si vos ISSR ont réellement été payées</h2></div><span className="tag">Premium</span></div>
   <p>Le calcul de vos droits reste disponible gratuitement. Le rapprochement avec vos bulletins de paie, la détection des écarts et la préparation d’une régularisation font partie du parcours Premium.</p>
  </section>
  <PremiumFeatureJourney
   eyebrow="Parcours Premium"
   title="Du remplacement à la régularisation, sans perdre le fil"
   description="Premium transforme vos droits calculés en contrôle concret de votre paie. Vous gardez la main à chaque étape : aucune proposition OCR n’est enregistrée sans validation."
   steps={[
    {title:'Ajouter une fiche de paie',detail:'Importez votre bulletin dans votre espace privé.'},
    {title:'Analyser et rapprocher les ISSR',detail:'Mon Remplacement repère les lignes pertinentes et les compare aux droits enregistrés mois par mois.'},
    {title:'Traiter les écarts',detail:'Suivez les montants manquants, priorisez les anomalies et préparez un dossier de régularisation si nécessaire.'},
   ]}
  />
  <section className="dashboard-panel report-panel"><span className="eyebrow">Inclus gratuitement</span><h2>Vos droits restent visibles sans Premium</h2><p>Vous pouvez continuer à enregistrer vos missions, calculer vos ISSR, suivre le mois en cours et consulter vos montants estimés. Premium intervient au moment de vérifier la paie réellement reçue.</p></section>
 </main>
}
