'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import useBetaProductMode from '@/components/use-beta-product-mode'

function parseEuro(value:string){
 const cleaned=value.replace(/\s/g,'').replace('€','').replace(',','.').replace(/[^0-9.-]/g,'')
 const n=Number(cleaned)
 return Number.isFinite(n)?n:0
}
function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function currentMonth(){return new Date().toISOString().slice(0,7)}

export default function IndemnityReconciliationBeta(){
 const pathname=usePathname()
 const mode=useBetaProductMode()
 const [mount,setMount]=useState<HTMLElement|null>(null)
 const [month,setMonth]=useState(currentMonth())
 const [estimated,setEstimated]=useState(0)
 const [paidInput,setPaidInput]=useState('')
 const visible=pathname==='/dashboard'

 useEffect(()=>{
  if(!visible)return
  let observer:MutationObserver|undefined
  let monthInput:HTMLInputElement|null=null
  let onMonth:(()=>void)|null=null
  let scheduled=false

  const sync=()=>{
   scheduled=false
   const page=document.querySelector('.indemnities-page,.indemnities-main')
   const summary=page?.querySelector('.indemnity-summary') as HTMLElement|null
   if(!page||!summary){setMount(null);return}

   let host=page.querySelector<HTMLElement>('#beta-indemnity-reconciliation')
   if(!host){
    host=document.createElement('div')
    host.id='beta-indemnity-reconciliation'
    summary.insertAdjacentElement('afterend',host)
   }
   setMount(host)

   const totalText=summary.querySelectorAll('article')[1]?.querySelector('strong')?.textContent??'0'
   setEstimated(parseEuro(totalText))

   const candidate=page.querySelector<HTMLInputElement>('input[type="month"]')
   if(candidate&&candidate!==monthInput){
    if(monthInput&&onMonth)monthInput.removeEventListener('change',onMonth)
    monthInput=candidate
    onMonth=()=>setMonth(candidate.value||currentMonth())
    monthInput.addEventListener('change',onMonth)
   }
   setMonth(candidate?.value||currentMonth())
  }
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
  schedule()
  observer=new MutationObserver(schedule)
  observer.observe(document.body,{childList:true,subtree:true,characterData:true})
  return()=>{
   observer?.disconnect()
   if(monthInput&&onMonth)monthInput.removeEventListener('change',onMonth)
   document.querySelector('#beta-indemnity-reconciliation')?.remove()
  }
 },[pathname,visible])

 useEffect(()=>{
  try{setPaidInput(window.localStorage.getItem(`mr-beta-paid-${month}`)??'')}catch{setPaidInput('')}
 },[month])

 const paid=useMemo(()=>{
  if(!paidInput.trim())return null
  const n=Number(paidInput.replace(',','.'))
  return Number.isFinite(n)?Math.max(0,n):null
 },[paidInput])
 const difference=paid==null?null:paid-estimated
 const state=paid==null?'unfilled':Math.abs(difference??0)<0.01?'ok':difference!<0?'missing':'over'

 function save(value:string){
  setPaidInput(value)
  try{
   if(value.trim())window.localStorage.setItem(`mr-beta-paid-${month}`,value)
   else window.localStorage.removeItem(`mr-beta-paid-${month}`)
  }catch{}
 }

 if(!visible||!mount)return null
 return createPortal(<section className={`beta-reconciliation ${mode}`} aria-label="Rapprochement ISSR attendu et versé">
  <div className="beta-reconciliation-head">
   <div><span className="eyebrow">Suivi Premium</span><h2>Attendu / versé</h2><p>Comparez l’estimation calculée par Mon Remplacement au montant réellement reçu pour le mois.</p></div>
   <span className="beta-premium-badge">PREMIUM</span>
  </div>
  {mode==='free'?<div className="beta-reconciliation-lock">
   <div className="beta-lock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
   <div><strong>Vérifiez vos versements automatiquement</strong><p>Premium permet de saisir le montant réellement reçu, de mesurer l’écart et de repérer les mois à vérifier.</p></div>
  </div>:<>
   <div className="beta-reconciliation-grid">
    <article><span>Montant attendu</span><strong>{euro(estimated)}</strong><small>calcul ISSR + primes</small></article>
    <article><span>Montant versé</span><label><input inputMode="decimal" value={paidInput} onChange={e=>save(e.target.value)} placeholder="0,00" aria-label="Montant réellement versé"/><b>€</b></label><small>saisie manuelle pour cette Beta</small></article>
    <article className={`beta-difference ${state}`}><span>Écart</span><strong>{difference==null?'—':`${difference>0?'+':''}${euro(difference)}`}</strong><small>{state==='ok'?'Montant conforme':state==='missing'?'Montant inférieur à l’attendu':state==='over'?'Montant supérieur à l’attendu':'Renseignez le montant versé'}</small></article>
   </div>
   <div className={`beta-reconciliation-status ${state}`}>
    <span className="beta-status-dot"/>
    <div><strong>{state==='ok'?'Aucun écart détecté':state==='missing'?'Versement à vérifier':state==='over'?'Écart positif à vérifier':'Versement non renseigné'}</strong><p>{state==='missing'?`Il manque ${euro(Math.abs(difference??0))} par rapport à l’estimation. Vérifiez votre bulletin ou le décalage éventuel de paiement.`:state==='over'?`Le versement dépasse l’estimation de ${euro(Math.abs(difference??0))}. Cela peut provenir d’un rattrapage ou d’un autre élément de paie.`:state==='ok'?'Le montant saisi correspond à l’estimation du mois.':'Saisissez le montant ISSR réellement reçu pour obtenir une comparaison.'}</p></div>
   </div>
   <p className="beta-reconciliation-note">Aide à la vérification uniquement : un écart n’établit pas à lui seul une erreur de paie. Les versements peuvent être décalés dans le temps.</p>
  </>}
 </section>,mount)
}
