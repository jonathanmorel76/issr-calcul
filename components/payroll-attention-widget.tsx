'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useBetaProductMode from '@/components/use-beta-product-mode'

type Entry={travel_date:string;total_amount:number}
type Payment={entitlement_month:string;received_amount:number}
type Payslip={title:string|null;file_name:string;created_at:string}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

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
  return [...expected.entries()].map(([month,total])=>({month,expected:total,received:received.get(month)??0,outstanding:Math.max(0,total-(received.get(month)??0))})).filter(row=>row.outstanding>0.01).sort((a,b)=>b.month.localeCompare(a.month))
 },[entries,payments])
 if(!visible)return null
 const totalOutstanding=rows.reduce((sum,row)=>sum+row.outstanding,0)
 const latest=payslips[0]
 return <section className="dashboard-panel report-panel" style={{marginTop:16}}>
  <div className="report-head"><div><span className="eyebrow">Paie à vérifier</span><h2>{premium?(rows.length?`${rows.length} mois à rapprocher`:'Tout est rapproché'):'Vérifiez ce qui vous a réellement été payé'}</h2></div><strong>{premium?(rows.length?euro(totalOutstanding):'✓'):<span className="tag">Premium</span>}</strong></div>
  {!premium?<><p>Premium compare vos droits ISSR calculés aux versements réellement retrouvés sur vos fiches de paie et signale les écarts.</p><Link className="btn btn-primary" href="/dashboard/versements">Découvrir le suivi de paie</Link></>:rows.length?<><p><strong>{euro(totalOutstanding)}</strong> de droits calculés ne sont pas encore entièrement rapprochés avec vos versements enregistrés.</p><div className="mr-list">{rows.slice(0,4).map(row=><article key={row.month}><div><strong>{monthLabel(row.month)}</strong><span>{euro(row.outstanding)} à vérifier</span><small>Droits {euro(row.expected)} · rapproché {euro(row.received)}</small></div><Link className="btn btn-export" href={`/dashboard/versements?month=${row.month}`}>Vérifier</Link></article>)}</div>{rows.length>4&&<p><small>+ {rows.length-4} autre(s) mois avec un solde à vérifier.</small></p>}</>:<p>Les droits ISSR enregistrés sont actuellement couverts par les versements rapprochés. Aucun écart à traiter.</p>}
  {premium&&<div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border, #e5e7eb)'}}><small>{latest?`Dernière fiche de paie enregistrée : ${latest.title||latest.file_name} · ${new Date(latest.created_at).toLocaleDateString('fr-FR')}`:'Aucune fiche de paie enregistrée pour le moment.'}</small></div>}
 </section>
}
