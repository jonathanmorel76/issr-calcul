'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import useBetaProductMode from '@/components/use-beta-product-mode'

type Entry={travel_date:string;total_amount:number}
type Payment={entitlement_month:string;received_amount:number}
type Payslip={title:string|null;file_name:string;created_at:string}
type Priority='watch'|'delay'|'anomaly'|'regularize'

type PayrollRow={
 month:string
 expected:number
 received:number
 outstanding:number
 ageMonths:number
 coverage:number
 priority:Priority
 priorityLabel:string
 priorityDetail:string
 priorityRank:number
}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}
function monthAge(value:string){
 const [year,month]=value.split('-').map(Number)
 const now=new Date()
 return Math.max(0,(now.getFullYear()-year)*12+(now.getMonth()+1-month))
}
function classify(month:string,expected:number,received:number,outstanding:number):Pick<PayrollRow,'ageMonths'|'coverage'|'priority'|'priorityLabel'|'priorityDetail'|'priorityRank'>{
 const ageMonths=monthAge(month)
 const coverage=expected>0?Math.min(100,Math.max(0,(received/expected)*100)):0
 if(ageMonths>=5)return {ageMonths,coverage,priority:'regularize',priorityLabel:'Régularisation à envisager',priorityDetail:'Ce solde est ancien. Vérifiez les bulletins disponibles et préparez une demande si aucun rappel n’apparaît.',priorityRank:4}
 if(ageMonths>=3)return {ageMonths,coverage,priority:'anomaly',priorityLabel:'Anomalie probable',priorityDetail:coverage>0?'Une partie a été rapprochée, mais un solde persiste depuis plusieurs mois.':'Aucun versement n’a encore été rapproché pour ces droits anciens.',priorityRank:3}
 if(ageMonths>=2)return {ageMonths,coverage,priority:'delay',priorityLabel:'Retard probable',priorityDetail:'Le décalage commence à devenir ancien dans votre suivi. Contrôlez les bulletins récents.',priorityRank:2}
 return {ageMonths,coverage,priority:'watch',priorityLabel:'À surveiller',priorityDetail:'Le mois est récent : un décalage de paie reste plausible avant de conclure à une anomalie.',priorityRank:1}
}

export default function PayrollAttentionWidget({entries,payments,payslips}:{entries:Entry[];payments:Payment[];payslips:Payslip[]}){
 const premium=useBetaProductMode()==='premium'
 const [mount,setMount]=useState<HTMLElement|null>(null)
 const [visible,setVisible]=useState(false)
 useEffect(()=>{
  let scheduled=false
  const sync=()=>{
   scheduled=false
   const params=new URLSearchParams(window.location.search)
   const view=params.get('view')
   const isDashboard=!view||view==='dashboard'
   setVisible(isDashboard)
   if(!isDashboard){setMount(null);document.querySelector('#payroll-top-feature-host')?.remove();return}
   const main=document.querySelector('.dashboard-main') as HTMLElement|null
   if(!main)return
   const anchor=(main.querySelector('.dashboard-stats')||main.querySelector('.widget-grid')||main.firstElementChild) as HTMLElement|null
   if(!anchor)return
   let host=main.querySelector<HTMLElement>('#payroll-top-feature-host')
   if(!host){host=document.createElement('div');host.id='payroll-top-feature-host'}
   if(anchor.nextElementSibling!==host)anchor.insertAdjacentElement('afterend',host)
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
 const rows=useMemo(()=>{
  const expected=new Map<string,number>(),received=new Map<string,number>()
  for(const entry of entries){const month=entry.travel_date.slice(0,7);expected.set(month,(expected.get(month)??0)+Number(entry.total_amount||0))}
  for(const payment of payments){const month=payment.entitlement_month.slice(0,7);received.set(month,(received.get(month)??0)+Number(payment.received_amount||0))}
  return [...expected.entries()].map(([month,total])=>{
   const paid=received.get(month)??0
   const outstanding=Math.max(0,total-paid)
   return {month,expected:total,received:paid,outstanding,...classify(month,total,paid,outstanding)}
  }).filter(row=>row.outstanding>0.01).sort((a,b)=>b.priorityRank-a.priorityRank||b.ageMonths-a.ageMonths||b.outstanding-a.outstanding)
 },[entries,payments])
 if(!visible||!mount)return null
 const totalOutstanding=rows.reduce((sum,row)=>sum+row.outstanding,0)
 const latest=payslips[0]
 const urgentCount=rows.filter(row=>row.priority==='anomaly'||row.priority==='regularize').length
 const openSubscription=()=>window.dispatchEvent(new CustomEvent('mr-open-premium-subscription',{detail:{source:'payroll-top-feature'}}))
 return createPortal(<section className={`payroll-top-feature ${premium?'premium-active':'free-preview'}`} aria-label="Top fonctionnalité Premium : contrôle de paie">
  <div className="payroll-top-ribbon">Top fonctionnalité</div>
  <div className="payroll-top-head">
   <div><span className="eyebrow">Contrôle de paie Premium</span><h2>Vérifiez que vos ISSR ont vraiment été payées</h2></div>
   <span className="premium-badge">Premium</span>
  </div>
  {!premium?<div className="payroll-top-preview">
   <div className="payroll-top-copy"><strong>De vos droits calculés jusqu’à la régularisation</strong><p>Mon Remplacement rapproche vos droits ISSR avec vos fiches de paie, repère les mois incomplets et vous guide quand un écart mérite d’être vérifié.</p></div>
   <div className="payroll-top-steps"><span><b>1</b>Ajouter une fiche de paie</span><span><b>2</b>Comparer attendu / versé</span><span><b>3</b>Traiter les écarts</span></div>
   <button type="button" className="btn btn-premium payroll-top-cta" onClick={openSubscription}>Découvrir cette fonctionnalité Premium</button>
  </div>:rows.length?<>
   <div className="payroll-top-summary"><div><span>À rapprocher</span><strong>{euro(totalOutstanding)}</strong><small>{rows.length} mois à vérifier</small></div><div className={urgentCount?'attention':'ok'}><span>Prioritaires</span><strong>{urgentCount}</strong><small>{urgentCount?'situation(s) ancienne(s)':'aucune urgence détectée'}</small></div></div>
   <div className="payroll-top-list">{rows.slice(0,3).map(row=><article key={row.month}><div><strong>{monthLabel(row.month)}</strong><span className={`payroll-priority ${row.priority}`}>{row.priorityLabel}</span><small>{euro(row.outstanding)} à vérifier · {row.coverage.toLocaleString('fr-FR',{maximumFractionDigits:0})} % déjà rapproché</small></div><Link className={row.priorityRank>=3?'btn btn-premium':'btn btn-export'} href={row.priority==='regularize'?`/dashboard/regularisation?month=${row.month}`:`/dashboard/versements?month=${row.month}`}>{row.priority==='regularize'?'Préparer le dossier':'Vérifier'}</Link></article>)}</div>
   <div className="payroll-top-footer"><small>{latest?`Dernière fiche de paie : ${latest.title||latest.file_name} · ${new Date(latest.created_at).toLocaleDateString('fr-FR')}`:'Aucune fiche de paie enregistrée.'}</small><Link className="btn btn-export" href="/dashboard/versements">Ouvrir le suivi complet</Link></div>
  </>:<div className="payroll-top-clear"><div><strong>Tout est rapproché</strong><p>Les droits ISSR enregistrés sont actuellement couverts par les versements rapprochés.</p></div><Link className="btn btn-export" href="/dashboard/versements">Voir mes versements</Link></div>}
 </section>,mount)
}
