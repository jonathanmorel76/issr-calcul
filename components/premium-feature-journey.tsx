'use client'

type Step={title:string;detail:string}

export default function PremiumFeatureJourney({eyebrow='Premium',title,description,steps,cta='Activer Premium dans la Beta'}:{eyebrow?:string;title:string;description:string;steps:Step[];cta?:string}){
 function activate(){
  try{window.localStorage.setItem('mr-beta-product-mode','premium')}catch{}
  window.dispatchEvent(new CustomEvent('mr-beta-product-mode',{detail:{mode:'premium'}}))
 }
 return <section className="dashboard-panel premium-locked-panel">
  <div className="report-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><span className="tag">Premium</span></div>
  <p>{description}</p>
  <div className="mr-list">{steps.map((step,index)=><article key={step.title}><div><strong>{index+1}. {step.title}</strong><small>{step.detail}</small></div></article>)}</div>
  <button className="btn btn-primary" onClick={activate}>{cta}</button>
 </section>
}
