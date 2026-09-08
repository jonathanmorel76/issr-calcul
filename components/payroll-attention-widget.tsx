'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import useBetaProductMode from '@/components/use-beta-product-mode'

type Entry={travel_date:string;total_amount:number}
type Payment={entitlement_month:string;received_amount:number}
type Payslip={title:string|null;file_name:string;created_at:string}
type Scope='dashboard'|'indemnities'

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}

export default function PayrollAttentionWidget({entries,payments,payslips}:{entries:Entry[];payments:Payment[];payslips:Payslip[]}){
 const premium=useBetaProductMode()==='premium'
 const [mount,setMount]=useState<HTMLElement|null>(null)
 const [scope,setScope]=useState<Scope|null>(null)
 useEffect(()=>{
  let scheduled=false
  const sync=()=>{
   scheduled=false
   const activeLabel=document.querySelector('.product-tabs button.active')?.textContent?.trim()??''
   const params=new URLSearchParams(window.location.search)
   const requested=params.get('view')
   const nextScope:Scope|null=
    activeLabel==='Mes indemnités'||requested==='indemnities'?'indemnities':
    (!activeLabel||activeLabel==='Tableau de bord'||!requested||requested==='dashboard')?'dashboard':null

   document.querySelectorAll('#payroll-top-feature-host').forEach((node,i)=>{if(i>0)node.remove()})
   if(!nextScope){setScope(null);setMount(null);document.querySelector('#payroll-top-feature-host')?.remove();return}

   const main=document.querySelector('.dashboard-main') as HTMLElement|null
   if(!main)return
   let host=main.querySelector<HTMLElement>('#payroll-top-feature-host')
   if(!host){host=document.createElement('div');host.id='payroll-top-feature-host'}

   if(nextScope==='dashboard'){
    const anchor=(main.querySelector('.dashboard-stats')||main.firstElementChild) as HTMLElement|null
    if(!anchor)return
    if(anchor.nextElementSibling!==host)anchor.insertAdjacentElement('afterend',host)
   }else{
    if(main.firstElementChild!==host)main.insertAdjacentElement('afterbegin',host)
   }
   setScope(nextScope)
   setMount(host)
  }
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
  schedule()
  const observer=new MutationObserver(schedule)
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  window.addEventListener('popstate',schedule)
  window.addEventListener('mr-dashboard-view',schedule as EventListener)
  return()=>{observer.disconnect();window.removeEventListener('popstate',schedule);window.removeEventListener('mr-dashboard-view',schedule as EventListener);document.querySelector('#payroll-top-feature-host')?.remove()}
 },[])
 const summary=useMemo(()=>{
  const expected=new Map<string,number>(),received=new Map<string,number>()
  for(const entry of entries){const month=entry.travel_date.slice(0,7);expected.set(month,(expected.get(month)??0)+Number(entry.total_amount||0))}
  for(const payment of payments){const month=payment.entitlement_month.slice(0,7);received.set(month,(received.get(month)??0)+Number(payment.received_amount||0))}
  let months=0,total=0
  for(const [month,amount] of expected){const gap=Math.max(0,amount-(received.get(month)??0));if(gap>.01){months++;total+=gap}}
  return {months,total}
 },[entries,payments])
 if(!scope||!mount)return null
 const latest=payslips[0]
 const contextualCopy=scope==='indemnities'
  ?'Vous savez ce qui devrait vous être versé. Paie ★ vous aide ensuite à vérifier ce qui a réellement été retrouvé sur vos bulletins.'
  :'Une vue dédiée rassemble vos droits, vos bulletins, les écarts détectés et les régularisations.'
 const footerCopy=scope==='indemnities'
  ?'Passez du montant attendu au contrôle du montant réellement versé.'
  :premium?'Accédez directement au contrôle complet de votre paie.':'Découvrez le parcours attendu → versé → écart → régularisation.'
 return createPortal(<section className={`payroll-top-feature payroll-top-feature-compact payroll-top-feature-${scope} ${premium?'premium-active':'free-preview'}`} aria-label="Top fonctionnalité : Paie">
  <div className="payroll-top-ribbon"><span aria-hidden="true">★</span> Top fonctionnalité</div>
  <div className="payroll-top-head">
   <div><span className="eyebrow">Paie Premium</span><h2>Vérifiez que vos ISSR ont vraiment été payées</h2><p>{contextualCopy}</p></div>
   <span className="premium-badge">Premium</span>
  </div>
  {premium&&<div className="payroll-top-mini-status"><div><span>À rapprocher</span><strong>{euro(summary.total)}</strong></div><div><span>Mois concernés</span><strong>{summary.months}</strong></div>{latest&&<small>Dernier bulletin : {new Date(latest.created_at).toLocaleDateString('fr-FR')}</small>}</div>}
  <div className="payroll-top-footer payroll-top-footer-compact">
   <span>{footerCopy}</span>
   <Link className="btn btn-primary payroll-hub-link" href="/dashboard/paie">Ouvrir Paie <span aria-hidden="true">★</span></Link>
  </div>
 </section>,mount)
}
