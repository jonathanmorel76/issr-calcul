'use client'

import PaymentsView from '@/components/payments-view'
import PremiumFeatureJourney from '@/components/premium-feature-journey'
import useBetaProductMode from '@/components/use-beta-product-mode'

export default function PaymentsAccessView({userId}:{userId:string}){
 const premium=useBetaProductMode()==='premium'
 if(premium)return <PaymentsView userId={userId}/>
 return <main className="dashboard-main reports-page payments-page">
  <section className="dashboard-panel report-panel">
   <div className="report-head"><div><span className="eyebrow">Suivi de paie</span><h2>Vérifiez si vos ISSR ont réellement été payées</h2></div><span className="tag">Pro</span></div>
   <p>Le calcul de vos droits reste disponible avec le mode Essentiel. Le rapprochement avec vos bulletins de paie, la détection des écarts et la préparation d’une régularisation prennent le relais lorsque vous souhaitez contrôler les montants réellement reçus.</p>
  </section>
  <PremiumFeatureJourney
   eyebrow="Parcours de contrôle"
   title="Du remplacement à la régularisation, sans perdre le fil"
   description="Transformez vos droits calculés en contrôle concret de votre paie. Vous gardez la main à chaque étape : aucune proposition OCR n’est enregistrée sans validation."
   steps={[
    {title:'Ajouter une fiche de paie',detail:'Importez votre bulletin dans votre espace privé.'},
    {title:'Analyser et rapprocher les ISSR',detail:'Mon Remplacement repère les lignes pertinentes et les compare aux droits enregistrés mois par mois.'},
    {title:'Traiter les écarts',detail:'Suivez les montants manquants, priorisez les anomalies et préparez un dossier de régularisation si nécessaire.'},
   ]}
  />
  <section className="dashboard-panel report-panel"><span className="eyebrow">Inclus dans le mode Essentiel</span><h2>Vos droits restent accessibles avec le mode Essentiel</h2><p>Vous pouvez continuer à enregistrer vos missions, calculer vos ISSR, suivre le mois en cours et consulter vos montants estimés. Le contrôle de paie intervient ensuite lorsque vous souhaitez comparer ces droits avec les sommes réellement versées.</p></section>
 </main>
}
