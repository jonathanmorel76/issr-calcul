'use client'

import { useEffect, useMemo, useState } from 'react'
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
 if(ageMonths>=5)return {ageMonths,coverage,priority:'regularize',priorityLabel:'🔴 Régularisation à envisager',priorityDetail:'Ce solde est ancien. Vérifiez les bulletins disponibles et préparez une demande si aucun rappel n’apparaît.',priorityRank:4}
 if(ageMonths>=3)return {ageMonths,coverage,priority:'anomaly',priorityLabel:'🟠 Anomalie probable',priorityDetail:coverage>0?'Une partie a été rapprochée, mais un solde persiste depuis plusieurs mois.':'Aucun versement n’a encore été rapproché pour ces droits anciens.',priorityRank:3}
 if(ageMonths>=2)return {ageMonths,coverage,priority:'delay',priorityLabel:'🟡 Retard probable',priorityDetail:'Le décalage commence à dépasser le délai habituel observé dans le suivi. Contrôlez les bulletins récents.',priorityRank:2}
 return {ageMonths,coverage,priority:'watch',priorityLabel:'🔵 À surveiller',priorityDetail:'Le mois est récent : un décalage de paie reste plausible avant de conclure à une anomalie.',priorityRank:1}
}

export default function PayrollAttentionWidget({entries,payments,payslips}:{entries:Entry[];payments:Payment[];payslips:Payslip[]}){
 const premium=useBetaProductMode()==='premium'
 const [visible,setVisible]=useState(false)
 useEffect(()=>{
  const sync=()=>{const params=new URLSearchParams(window.location.search);const view=params.get('view');setVisible(!view||view==='dashboard')}
  sync();window.addEventListener('popstate',sync);window.addEventListener('mr-dashboard-view',sync as EventListener)
  const timer=window.setInterval(sync,500)
  return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('mr-dashboard-view',sync as EventListener);window.clearInterval(timer)}
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
 if(!visible)return null
 const totalOutstanding=rows.reduce((sum,row)=>sum+row.outstanding,0)
 const latest=payslips[0]
 const urgentCount=rows.filter(row=>row.priority==='anomaly'||row.priority==='regularize').length
 return <section className="dashboard-panel report-panel" style={{marginTop:16}}>
  <div className="report-head"><div><span className="eyebrow">Paie à vérifier</span><h2>{premium?(rows.length?`${rows.length} mois à rapprocher`:'Tout est rapproché'):'Vérifiez ce qui vous a réellement été payé'}</h2></div><strong>{premium?(rows.length?euro(totalOutstanding):'✓'):<span className="tag">Premium</span>}</strong></div>
  {!premium?<><p>Premium compare vos droits ISSR calculés aux versements réellement retrouvés sur vos fiches de paie et hiérarchise les écarts à traiter.</p><Link className="btn btn-primary" href="/dashboard/versements">Découvrir le suivi de paie</Link></>:rows.length?<><p><strong>{euro(totalOutstanding)}</strong> de droits calculés ne sont pas encore entièrement rapprochés.{urgentCount>0?` ${urgentCount} situation${urgentCount>1?'s':''} mérite${urgentCount>1?'nt':''} une vérification prioritaire.`:''}</p><div className="mr-list">{rows.slice(0,5).map(row=><article key={row.month}><div><strong>{monthLabel(row.month)} · {row.priorityLabel}</strong><span>{euro(row.outstanding)} à vérifier · {row.coverage.toLocaleString('fr-FR',{maximumFractionDigits:0})} % déjà rapproché</span><small>Droits {euro(row.expected)} · rapproché {euro(row.received)} · {row.priorityDetail}</small></div><Link className={row.priorityRank>=3?'btn btn-primary':'btn btn-export'} href={`/dashboard/versements?month=${row.month}`}>{row.priority==='regularize'?'Traiter':'Vérifier'}</Link></article>)}</div>{rows.length>5&&<p><small>+ {rows.length-5} autre(s) mois avec un solde à vérifier.</small></p>}<p><small>La priorité est indicative : elle aide à organiser les contrôles selon l’ancienneté du solde, sans présumer du calendrier réel de paie de l’administration.</small></p></>:<p>Les droits ISSR enregistrés sont actuellement couverts par les versements rapprochés. Aucun écart à traiter.</p>}
  {premium&&<div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border, #e5e7eb)'}}><small>{latest?`Dernière fiche de paie enregistrée : ${latest.title||latest.file_name} · ${new Date(latest.created_at).toLocaleDateString('fr-FR')}`:'Aucune fiche de paie enregistrée pour le moment.'}</small></div>}
 </section>
}
