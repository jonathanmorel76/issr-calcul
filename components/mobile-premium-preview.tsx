'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

type Mode='free'|'premium'
type Billing='monthly'|'annual'
type ViewKey='dashboard'|'establishments'|'missions'|'indemnities'|'payroll'|'reports'|'documents'
type Copy={title:string;premium:string}

const COPY:Record<ViewKey,Copy>={
 dashboard:{title:'Ne laissez passer aucun écart',premium:'Visualisez en un coup d’œil les versements et les points qui méritent votre attention.'},
 establishments:{title:'Retrouvez l’origine de vos indemnités',premium:'Reliez vos jours, kilomètres et montants aux établissements concernés.'},
 missions:{title:'Anticipez les erreurs de suivi',premium:'Repérez les chevauchements et les informations manquantes avant qu’ils ne posent problème.'},
 indemnities:{title:'Vérifiez ce qui vous est versé',premium:'Comparez vos estimations aux versements reçus et retrouvez rapidement les écarts.'},
 payroll:{title:'Contrôlez votre paie sans tout recalculer',premium:'Rapprochez vos fiches de paie des droits calculés et préparez une régularisation claire.'},
 reports:{title:'Justifiez toute votre année',premium:'Retrouvez l’année scolaire complète et exportez un bilan prêt à conserver.'},
 documents:{title:'Gardez vos preuves au bon endroit',premium:'Reliez chaque justificatif à la mission concernée et constituez un dossier clair.'},
}

function detectView(pathname:string):ViewKey{
 if(pathname.includes('/paie')||pathname.includes('/versements')||pathname.includes('/regularisation'))return 'payroll'
 if(pathname.includes('/bilans'))return 'reports'
 if(pathname.includes('/documents'))return 'documents'
 const active=document.querySelector('.product-tabs button.active')?.textContent?.trim()??''
 if(active.includes('établissement'))return 'establishments'
 if(active.includes('mission'))return 'missions'
 if(active.includes('indemnité'))return 'indemnities'
 return 'dashboard'
}

export default function MobilePremiumPreview(){
 const pathname=usePathname()
 const [mode,setMode]=useState<Mode>('free')
 const [billing,setBilling]=useState<Billing>('annual')
 const [view,setView]=useState<ViewKey>('dashboard')
 const [open,setOpen]=useState(false)
 const visible=pathname.startsWith('/dashboard')

 useEffect(()=>{try{const saved=window.localStorage.getItem('mr-beta-product-mode');if(saved==='premium')setMode('premium')}catch{}},[])
 useEffect(()=>{
  try{window.localStorage.setItem('mr-beta-product-mode',mode)}catch{}
  document.documentElement.dataset.productMode=mode
  window.dispatchEvent(new CustomEvent('mr-beta-product-mode',{detail:{mode}}))
 },[mode])
 useEffect(()=>{
  if(!visible)return
  let scheduled=false
  const update=()=>{scheduled=false;setView(detectView(pathname))}
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(update)}
  schedule()
  const observer=new MutationObserver(schedule)
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  return()=>observer.disconnect()
 },[pathname,visible])
 useEffect(()=>{
  const show=()=>setOpen(true)
  window.addEventListener('mr-open-premium',show)
 return()=>window.removeEventListener('mr-open-premium',show)
 },[])

 const copy=useMemo(()=>COPY[view],[view])
 if(!visible)return null
 const premiumActive=mode==='premium'
 const activate=()=>{setMode('premium');setOpen(false)}

 return <>
  <button type="button" className={`beta-mode-pill ${mode}`} onClick={()=>setOpen(true)} aria-label="Ouvrir mon offre"><span className="beta-mode-dot"/><span>{premiumActive?'Pro':'Essentiel'}</span></button>
  {open&&<div className="beta-mode-backdrop" role="dialog" aria-modal="true" aria-label="Mon Remplacement Pro" onClick={()=>setOpen(false)}>
   <section className="beta-mode-sheet" onClick={e=>e.stopPropagation()}>
    <div className="beta-mode-sheet-handle"/>
    <header><div><span>MON REMPLACEMENT PRO</span><h2>{premiumActive?'Le mode Pro est actif':'Vérifier. Anticiper. Justifier.'}</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fermer">×</button></header>
    <p className="beta-plan-intro">{premiumActive?'Tous les outils de contrôle sont activés dans cette préversion.':'Le calcul ISSR reste inclus dans le mode Essentiel. Le mode Pro vous aide à contrôler vos versements et à préparer vos justificatifs.'}</p>

    {!premiumActive&&<>
     <div className="beta-benefit-focus"><strong>{copy.title}</strong><p>{copy.premium}</p><ul><li><span aria-hidden="true">✓</span>Comparer attendu et versé</li><li><span aria-hidden="true">✓</span>Repérer les anomalies</li><li><span aria-hidden="true">✓</span>Exporter un dossier clair</li></ul></div>
     <div className="beta-billing-choice" role="radiogroup" aria-label="Choisir la formule">
      <button type="button" className={billing==='annual'?'active':''} onClick={()=>setBilling('annual')} role="radio" aria-checked={billing==='annual'}><span className="beta-save-chip">−37 %</span><strong>Annuel</strong><b>29,99 € <small>/ an</small></b><em>soit 2,50 € / mois</em></button>
      <button type="button" className={billing==='monthly'?'active':''} onClick={()=>setBilling('monthly')} role="radio" aria-checked={billing==='monthly'}><strong>Mensuel</strong><b>3,99 € <small>/ mois</small></b><em>sans engagement annuel</em></button>
     </div>
     <button type="button" className="beta-subscribe-cta" onClick={activate}>Tester le mode Pro sur mes données</button>
     <p className="beta-trial-note">Simulation Beta : aucun paiement n’est effectué.</p>
    </>}

    {premiumActive&&<div className="beta-premium-active-card"><span className="beta-premium-active-icon" aria-hidden="true">✓</span><div><strong>Le mode Pro est actif</strong><p>Les analyses, contrôles, exports et rapprochements attendu / versé sont disponibles.</p></div></div>}

    <div className="beta-plan-footer"><button type="button" onClick={()=>setMode(premiumActive?'free':'premium')}>{premiumActive?'Revenir au mode Essentiel':'Activer le mode Pro pour la Beta'}</button><span>Simulation de préproduction</span></div>
   </section>
  </div>}
 </>
}
