'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

type Mode='free'|'premium'
type ViewKey='dashboard'|'establishments'|'missions'|'indemnities'|'reports'|'documents'

type Copy={title:string;free:string;premium:string;benefits:string[]}

const COPY:Record<ViewKey,Copy>={
 dashboard:{title:'Tableau de bord enrichi',free:'Le suivi essentiel reste gratuit : mission en cours, météo et estimation ISSR du mois.',premium:'Les indicateurs avancés et alertes de vérification sont activés.',benefits:['Alertes d’anomalies','Évolution mensuelle','Synthèse attendu / versé']},
 establishments:{title:'Analyse par établissement',free:'Créer, modifier et retrouver vos établissements reste gratuit.',premium:'Les statistiques détaillées par établissement sont activées.',benefits:['Jours effectués','Kilomètres cumulés','ISSR estimées par lieu']},
 missions:{title:'Contrôles avancés des missions',free:'La création des missions et tout l’historique restent gratuits.',premium:'Les contrôles automatiques de cohérence sont activés.',benefits:['Chevauchements','Journées inhabituelles','Situations à vérifier']},
 indemnities:{title:'Vérifier ce qui a été versé',free:'Le calcul de ce que vous devriez recevoir reste gratuit.',premium:'Le rapprochement entre estimation et versement réel est activé.',benefits:['Montant réellement reçu','Attendu vs versé','Anomalies de paiement']},
 reports:{title:'Bilans complets',free:'Un aperçu du mois courant reste accessible gratuitement.',premium:'Les bilans complets et les exports sont activés.',benefits:['Année scolaire complète','Analyses et classements','Exports PDF et Excel']},
 documents:{title:'Documents avancés',free:'Vous pouvez conserver vos documents essentiels dans votre espace.',premium:'L’archivage enrichi et les associations avancées sont activés.',benefits:['Classement étendu','Association aux missions','Préparation à la vérification automatique']},
}

function detectView(pathname:string):ViewKey{
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
 const [view,setView]=useState<ViewKey>('dashboard')
 const [open,setOpen]=useState(false)

 useEffect(()=>{try{const saved=window.localStorage.getItem('mr-beta-product-mode');if(saved==='premium')setMode('premium')}catch{}},[])
 useEffect(()=>{try{window.localStorage.setItem('mr-beta-product-mode',mode)}catch{};document.documentElement.dataset.productMode=mode},[mode])
 useEffect(()=>{
  let scheduled=false
  const update=()=>{scheduled=false;setView(detectView(pathname))}
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(update)}
  schedule()
  const observer=new MutationObserver(schedule)
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  return()=>observer.disconnect()
 },[pathname])

 const copy=useMemo(()=>COPY[view],[view])
 return <>
  <button type="button" className={`beta-mode-pill ${mode}`} onClick={()=>setOpen(true)} aria-label="Changer le mode de démonstration">
   <span className="beta-mode-dot"/><span>Beta · {mode==='premium'?'Premium':'Gratuit'}</span>
  </button>
  <aside className={`mobile-premium-context ${mode}`} aria-label="Aperçu de l’offre">
   <div><span className="mobile-premium-kicker">{mode==='premium'?'PREMIUM ACTIF':'MON REMPLACEMENT PREMIUM'}</span><strong>{copy.title}</strong><p>{mode==='premium'?copy.premium:copy.free}</p></div>
   <button type="button" onClick={()=>setOpen(true)}>{mode==='premium'?'Voir les avantages':'Découvrir Premium'}</button>
  </aside>
  {open&&<div className="beta-mode-backdrop" role="dialog" aria-modal="true" aria-label="Aperçu Gratuit et Premium" onClick={()=>setOpen(false)}>
   <section className="beta-mode-sheet" onClick={e=>e.stopPropagation()}>
    <div className="beta-mode-sheet-handle"/>
    <header><div><span>MODE DE DÉMONSTRATION</span><h2>Tester Gratuit / Premium</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fermer">×</button></header>
    <p>Ce sélecteur sert uniquement à valider l’expérience mobile avant l’intégration du paiement.</p>
    <div className="beta-plan-switch"><button className={mode==='free'?'active':''} onClick={()=>setMode('free')}><strong>Gratuit</strong><small>Organiser + calculer</small></button><button className={mode==='premium'?'active':''} onClick={()=>setMode('premium')}><strong>Premium</strong><small>3,99 € / mois</small></button></div>
    <div className="beta-plan-card"><span>{copy.title}</span><strong>{mode==='premium'?copy.premium:copy.free}</strong>{mode==='premium'&&<ul>{copy.benefits.map(x=><li key={x}>{x}</li>)}</ul>}</div>
    <div className="beta-pricing"><div><strong>3,99 €</strong><small>par mois</small></div><div><strong>29,99 €</strong><small>par an · 14 jours d’essai</small></div></div>
   </section>
  </div>}
 </>
}
