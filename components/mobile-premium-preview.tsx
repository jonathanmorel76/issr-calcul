'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

type Mode='free'|'premium'
type Billing='monthly'|'annual'
type ViewKey='dashboard'|'establishments'|'missions'|'indemnities'|'payroll'|'reports'|'documents'
type Copy={title:string;free:string;premium:string;benefits:string[]}

const COPY:Record<ViewKey,Copy>={
 dashboard:{title:'Votre suivi, sans zone d’ombre',free:'Mission en cours, météo et estimation ISSR restent disponibles avec le mode Essentiel.',premium:'Ajoutez les alertes, tendances et contrôles de versement à votre tableau de bord.',benefits:['Alertes et points à vérifier','Évolution de vos indemnités','Synthèse attendu / versé']},
 establishments:{title:'Comprendre vos établissements',free:'Créer, modifier et retrouver vos établissements reste disponible avec le mode Essentiel.',premium:'Identifiez les écoles où vous intervenez le plus et ce qu’elles représentent dans votre activité.',benefits:['Jours effectués par établissement','Kilomètres cumulés','ISSR estimées par lieu']},
 missions:{title:'Sécuriser le suivi de vos missions',free:'Créer vos missions et conserver votre historique reste disponible avec le mode Essentiel.',premium:'Repérez automatiquement les situations qui méritent une vérification.',benefits:['Chevauchements de périodes','Informations manquantes','Situations inhabituelles à vérifier']},
 indemnities:{title:'Vérifier ce qui vous est versé',free:'Le calcul de ce que vous devriez recevoir reste disponible avec le mode Essentiel.',premium:'Comparez vos estimations aux versements réellement reçus et retrouvez rapidement les écarts.',benefits:['Montant réellement reçu','Attendu vs versé','Mois à vérifier']},
 payroll:{title:'La fonctionnalité phare : contrôler votre paie',free:'Vos droits ISSR restent calculés avec le mode Essentiel.',premium:'Rapprochez vos fiches de paie avec les droits calculés, repérez les montants manquants et préparez une régularisation depuis une seule vue.',benefits:['Analyse des fiches de paie','Attendu vs réellement versé','Détection et priorisation des écarts','Dossier de régularisation']},
 reports:{title:'Prendre du recul sur votre année',free:'Le mois courant reste consultable avec le mode Essentiel.',premium:'Accédez à l’année scolaire complète, aux analyses détaillées et aux exports.',benefits:['Année scolaire complète','Analyses et classements','Exports PDF et Excel']},
 documents:{title:'Centraliser vos justificatifs',free:'Conservez jusqu’à 5 documents essentiels avec le mode Essentiel.',premium:'Classez davantage de documents et reliez-les directement à votre activité.',benefits:['Archivage étendu','Association aux missions','Préparation à la vérification automatique']},
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
 useEffect(()=>{try{window.localStorage.setItem('mr-beta-product-mode',mode)}catch{};document.documentElement.dataset.productMode=mode;window.dispatchEvent(new CustomEvent('mr-beta-product-mode',{detail:{mode}}))},[mode])
 useEffect(()=>{if(!visible)return;let scheduled=false;const update=()=>{scheduled=false;setView(detectView(pathname))};const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(update)};schedule();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});return()=>observer.disconnect()},[pathname,visible])

 const copy=useMemo(()=>COPY[view],[view])
 if(!visible)return null
 const premiumActive=mode==='premium'
 const activate=()=>{setMode('premium');setOpen(false)}

 return <>
  <button type="button" className={`beta-mode-pill ${mode}`} onClick={()=>setOpen(true)} aria-label="Ouvrir mon offre"><span className="beta-mode-dot"/><span>{premiumActive?'Pro':'Essentiel'}</span></button>
  {open&&<div className="beta-mode-backdrop" role="dialog" aria-modal="true" aria-label="Mon Remplacement Pro" onClick={()=>setOpen(false)}>
   <section className="beta-mode-sheet" onClick={e=>e.stopPropagation()}>
    <div className="beta-mode-sheet-handle"/>
    <header><div><span>MON REMPLACEMENT PRO</span><h2>{premiumActive?'Votre offre Pro':'14 jours pour tout essayer'}</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fermer">×</button></header>
    <p className="beta-plan-intro">{premiumActive?'Toutes les fonctions du mode Pro sont activées dans cette préversion.':'Gardez le calcul et l’organisation essentiels avec le mode Essentiel. Passez au mode Pro pour analyser, vérifier et automatiser votre suivi.'}</p>
    {!premiumActive&&<><div className="beta-benefit-focus"><strong>{copy.title}</strong><p>{copy.premium}</p><ul>{copy.benefits.map(x=><li key={x}><span aria-hidden="true">✓</span>{x}</li>)}</ul></div><div className="beta-billing-choice" role="radiogroup" aria-label="Choisir la formule"><button type="button" className={billing==='annual'?'active':''} onClick={()=>setBilling('annual')} role="radio" aria-checked={billing==='annual'}><span className="beta-save-chip">−37 %</span><strong>Annuel</strong><b>29,99 € <small>/ an</small></b><em>soit 2,50 € / mois</em></button><button type="button" className={billing==='monthly'?'active':''} onClick={()=>setBilling('monthly')} role="radio" aria-checked={billing==='monthly'}><strong>Mensuel</strong><b>3,99 € <small>/ mois</small></b><em>sans engagement annuel</em></button></div><button type="button" className="beta-subscribe-cta" onClick={activate}>Démarrer mes 14 jours d’essai</button><p className="beta-trial-note">Aucun paiement n’est effectué dans cette Beta. Le bouton active simplement le mode Pro de démonstration.</p></>}
    {premiumActive&&<div className="beta-premium-active-card"><span className="beta-premium-active-icon" aria-hidden="true">✓</span><div><strong>Le mode Pro est actif</strong><p>Les analyses, contrôles, exports et rapprochements attendu / versé sont disponibles.</p></div></div>}
    <div className="beta-plan-footer"><button type="button" onClick={()=>setMode(premiumActive?'free':'premium')}>{premiumActive?'Revenir au mode Essentiel':'Activer le mode Pro pour la Beta'}</button><span>Simulation de préproduction</span></div>
   </section>
  </div>}
 </>
}
