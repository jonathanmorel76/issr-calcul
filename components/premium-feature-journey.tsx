'use client'

type Step={title:string;detail:string}

export default function PremiumFeatureJourney({eyebrow='Fonction avancée',title,description,steps,cta='Voir l’offre'}:{eyebrow?:string;title:string;description:string;steps:Step[];cta?:string}){
 function openSubscription(){
  window.dispatchEvent(new CustomEvent('mr-open-premium-subscription'))
 }
 return <section className="dashboard-panel report-panel premium-journey-panel" data-premium-entry>
  <div className="report-head premium-journey-head">
   <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
   <button type="button" className="premium-badge premium-entry-link" onClick={openSubscription}>Pro</button>
  </div>
  <div className="premium-highlight-card">
   <p>{description}</p>
   <div className="premium-steps">
    {steps.map((step,index)=><article className="premium-step" key={step.title}>
     <span className="premium-step-index">{index+1}</span>
     <div>
      <strong>{step.title}</strong>
      <small>{step.detail}</small>
     </div>
    </article>)}
   </div>
  </div>
  <div className="report-actions premium-journey-actions">
   <button className="btn btn-premium" onClick={openSubscription}>{cta}</button>
  </div>
 </section>
}
