'use client'

type Step={title:string;detail:string}

export default function PremiumFeatureJourney({eyebrow='Premium',title,description,steps,cta='Activer Premium dans la Beta'}:{eyebrow?:string;title:string;description:string;steps:Step[];cta?:string}){
 function activate(){
  try{window.localStorage.setItem('mr-beta-product-mode','premium')}catch{}
  window.dispatchEvent(new CustomEvent('mr-beta-product-mode',{detail:{mode:'premium'}}))
 }
 return <section className="dashboard-panel report-panel premium-journey-panel">
  <div className="report-head premium-journey-head">
   <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
   <span className="premium-badge">Premium</span>
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
   <button className="btn btn-premium" onClick={activate}>{cta}</button>
  </div>
 </section>
}
