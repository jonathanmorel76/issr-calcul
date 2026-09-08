'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import useBetaProductMode from '@/components/use-beta-product-mode'

type Entry={travel_date:string;total_amount:number}
type MonthRow={month:string;expected:number;paid:number|null;difference:number|null;state:'unfilled'|'ok'|'missing'|'over'}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

export default function PremiumPaymentOverviewBeta(){
 const pathname=usePathname()
 const supabase=useMemo(()=>createClient(),[])
 const mode=useBetaProductMode()
 const [entries,setEntries]=useState<Entry[]>([])
 const [mount,setMount]=useState<HTMLElement|null>(null)
 const [scope,setScope]=useState<'dashboard'|'reports'|null>(null)
 const [version,setVersion]=useState(0)

 useEffect(()=>{let live=true;(async()=>{const {data}=await supabase.from('issr_entries').select('travel_date,total_amount').order('travel_date');if(live)setEntries((data??[]) as Entry[])})();return()=>{live=false}},[supabase])
 useEffect(()=>{
  const onStorage=(event:StorageEvent)=>{if(event.key?.startsWith('mr-beta-paid-'))setVersion(v=>v+1)}
  const onFocus=()=>setVersion(v=>v+1)
  window.addEventListener('storage',onStorage);window.addEventListener('focus',onFocus)
  return()=>{window.removeEventListener('storage',onStorage);window.removeEventListener('focus',onFocus)}
 },[])
 useEffect(()=>{
  let scheduled=false
  const sync=()=>{
   scheduled=false
   document.querySelectorAll('#beta-payment-overview').forEach((node,i)=>{if(i>0)node.remove()})
   if(pathname.includes('/bilans')){
    const main=document.querySelector('.reports-page') as HTMLElement|null
    const anchor=main?.querySelector('.report-kpis') as HTMLElement|null
    if(main&&anchor){let host=main.querySelector<HTMLElement>('#beta-payment-overview');if(!host){host=document.createElement('div');host.id='beta-payment-overview';anchor.insertAdjacentElement('afterend',host)}setScope('reports');setMount(host);return}
   }
   if(pathname==='/dashboard'){
   const active=document.querySelector('.product-tabs button.active')?.textContent?.trim()??''
   const dashboardVisible=!active||active==='Tableau de bord'
    if(dashboardVisible){const main=document.querySelector('.dashboard-main') as HTMLElement|null;const anchor=main?.querySelector('.widget-grid') as HTMLElement|null;if(main&&anchor){let host=main.querySelector<HTMLElement>('#beta-payment-overview');if(!host){host=document.createElement('div');host.id='beta-payment-overview';anchor.insertAdjacentElement('beforebegin',host)}setScope('dashboard');setMount(host);return}}
   }
   setScope(null);setMount(null);document.querySelector('#beta-payment-overview')?.remove()
  }
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
  schedule();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  return()=>{observer.disconnect();document.querySelector('#beta-payment-overview')?.remove()}
 },[pathname])

 const rows=useMemo(()=>{
  void version
  const map=new Map<string,number>()
  for(const entry of entries){const month=entry.travel_date.slice(0,7);map.set(month,(map.get(month)??0)+Number(entry.total_amount))}
  return [...map.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([month,expected]):MonthRow=>{
   let raw:string|null=null;try{raw=window.localStorage.getItem(`mr-beta-paid-${month}`)}catch{}
   const paid=raw&&raw.trim()!==''&&Number.isFinite(Number(raw.replace(',','.')))?Math.max(0,Number(raw.replace(',','.'))):null
   const difference=paid==null?null:paid-expected
   const state:MonthRow['state']=paid==null?'unfilled':Math.abs(difference??0)<0.01?'ok':difference!<0?'missing':'over'
   return {month,expected,paid,difference,state}
  })
 },[entries,version])

 const filled=rows.filter(r=>r.paid!=null),issues=filled.filter(r=>r.state==='missing'||r.state==='over'),missingOnly=filled.filter(r=>r.state==='missing')
 const cumulativeGap=missingOnly.reduce((sum,r)=>sum+Math.abs(r.difference??0),0)
 const paidTotal=filled.reduce((sum,r)=>sum+(r.paid??0),0),expectedTotal=filled.reduce((sum,r)=>sum+r.expected,0)
 const recentIssues=issues.slice(0,3)

 if(!mount||!scope)return null
 return createPortal(<section className={`beta-payment-overview ${mode} ${scope}`} aria-label="Synthèse Pro des versements ISSR">
  <div className="beta-payment-overview-head"><div><span className="eyebrow">Suivi</span><h2>{scope==='dashboard'?'Mes versements à surveiller':'Attendu / versé sur la période'}</h2></div><span className="beta-premium-badge">PRO</span></div>
  {mode==='free'?<div className="beta-payment-overview-lock"><strong>Repérez les mois à vérifier sans ouvrir chaque détail</strong><p>Consolidez les montants attendus et versés, puis repérez les écarts qui méritent une vérification.</p></div>:<>
   <div className="beta-payment-kpis"><article><span>Mois renseignés</span><strong>{filled.length}</strong></article><article className={issues.length?'attention':'ok'}><span>Mois à vérifier</span><strong>{issues.length}</strong></article><article className={cumulativeGap>0?'attention':'ok'}><span>Écart manquant cumulé</span><strong>{euro(cumulativeGap)}</strong></article>{scope==='reports'&&<article><span>Attendu / versé</span><strong>{euro(expectedTotal)} / {euro(paidTotal)}</strong></article>}</div>
   {recentIssues.length?<div className="beta-payment-issues">{recentIssues.map(row=><article key={row.month}><div><strong>{monthLabel(row.month)}</strong><small>Attendu {euro(row.expected)} · versé {euro(row.paid??0)}</small></div><span className={row.state}>{row.difference!>0?'+':''}{euro(row.difference??0)}</span></article>)}</div>:<div className="beta-payment-clear"><strong>{filled.length?'Aucun écart à vérifier':'Aucun versement renseigné'}</strong><p>{filled.length?'Les mois renseignés correspondent aux estimations enregistrées.':'Renseignez les montants reçus dans Mes indemnités pour alimenter ce suivi.'}</p></div>}
   <p className="beta-payment-note">Indicateur d’aide à la vérification : les décalages de paie et rattrapages peuvent expliquer certains écarts.</p>
  </>}
 </section>,mount)
}
