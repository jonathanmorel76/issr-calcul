'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import useBetaProductMode from '@/components/use-beta-product-mode'

type Establishment={id:string;name:string;address:string;usual_distance_km:number|null}
type Mission={id:string;title:string|null;start_date:string;end_date:string;status:string;establishment_id:string|null;teacher_replacement_status:string|null;mission_nature:string|null;issr_establishments:{name:string}|null}
type Entry={mission_id:string|null;travel_date:string;distance_km:number;total_amount:number;destination:string}
type Scope='establishments'|'missions'|null

type EstStat={id:string;name:string;missions:number;days:number;km:number;total:number;distance:number|null}
type MissionIssue={id:string;title:string;detail:string;kind:'warning'|'info'}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function frDate(value:string){return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}

export default function PremiumOperationalInsightsBeta(){
 const pathname=usePathname()
 const supabase=useMemo(()=>createClient(),[])
 const mode=useBetaProductMode()
 const [scope,setScope]=useState<Scope>(null)
 const [mount,setMount]=useState<HTMLElement|null>(null)
 const [establishments,setEstablishments]=useState<Establishment[]>([])
 const [missions,setMissions]=useState<Mission[]>([])
 const [entries,setEntries]=useState<Entry[]>([])
 const [loading,setLoading]=useState(false)

 useEffect(()=>{
  if(pathname!=='/dashboard'){setScope(null);setMount(null);return}
  let scheduled=false
  const sync=()=>{
   scheduled=false
   const active=document.querySelector('.product-tabs button.active')?.textContent?.trim()??''
   const nextScope:Scope=active.includes('établissement')?'establishments':active.includes('mission')?'missions':null
   if(!nextScope){setScope(null);setMount(null);document.querySelector('#beta-operational-insights')?.remove();return}
   const main=document.querySelector('.dashboard-main') as HTMLElement|null
   if(!main)return
   let host=main.querySelector<HTMLElement>('#beta-operational-insights')
   if(!host){host=document.createElement('div');host.id='beta-operational-insights'}
   const primaryPanel=main.querySelector('.dashboard-panel')
   if(primaryPanel&&primaryPanel.nextElementSibling!==host)primaryPanel.insertAdjacentElement('afterend',host)
   if(!host.isConnected)return
   setScope(nextScope);setMount(host)
  }
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
  schedule()
  const observer=new MutationObserver(schedule)
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  return()=>{observer.disconnect();document.querySelector('#beta-operational-insights')?.remove()}
 },[pathname])

 useEffect(()=>{
  if(!scope)return
  let live=true
  setLoading(true)
  ;(async()=>{
   const [e,m,d]=await Promise.all([
    supabase.from('issr_establishments').select('id,name,address,usual_distance_km').order('name'),
    supabase.from('issr_missions').select('id,title,start_date,end_date,status,establishment_id,teacher_replacement_status,mission_nature,issr_establishments(name)').order('start_date',{ascending:false}),
    supabase.from('issr_entries').select('mission_id,travel_date,distance_km,total_amount,destination').order('travel_date',{ascending:false}),
   ])
   if(!live)return
   setEstablishments((e.data??[]) as Establishment[])
   setMissions((m.data??[]) as unknown as Mission[])
   setEntries((d.data??[]) as Entry[])
   setLoading(false)
  })()
  return()=>{live=false}
 },[scope,supabase])

 const estStats=useMemo<EstStat[]>(()=>{
  const missionToEst=new Map<string,string>()
  for(const mission of missions){if(mission.establishment_id&&mission.status!=='cancelled')missionToEst.set(mission.id,mission.establishment_id)}
  return establishments.map(est=>{
   const relatedMissions=missions.filter(m=>m.establishment_id===est.id&&m.status!=='cancelled')
   const relatedEntries=entries.filter(entry=>entry.mission_id&&missionToEst.get(entry.mission_id)===est.id)
   return {id:est.id,name:est.name,missions:relatedMissions.length,days:relatedEntries.length,km:relatedEntries.reduce((s,e)=>s+Number(e.distance_km),0),total:relatedEntries.reduce((s,e)=>s+Number(e.total_amount),0),distance:est.usual_distance_km==null?null:Number(est.usual_distance_km)}
  }).sort((a,b)=>b.days-a.days||b.missions-a.missions||a.name.localeCompare(b.name)).slice(0,5)
 },[establishments,missions,entries])

 const missionIssues=useMemo<MissionIssue[]>(()=>{
  const active=missions.filter(m=>m.status!=='cancelled')
  const issues:MissionIssue[]=[]
  for(const mission of active){
   const label=mission.issr_establishments?.name||mission.title||'Mission'
   if(!mission.establishment_id||!mission.issr_establishments)issues.push({id:`${mission.id}-est`,title:'Établissement à vérifier',detail:`${label} · rattachement établissement manquant.`,kind:'warning'})
   if(!mission.teacher_replacement_status)issues.push({id:`${mission.id}-status`,title:'Statut enseignant à compléter',detail:`${label} · ${frDate(mission.start_date)}.`,kind:'info'})
   if(!mission.mission_nature)issues.push({id:`${mission.id}-nature`,title:'Nature de mission à compléter',detail:`${label} · utile pour fiabiliser l’analyse.`,kind:'info'})
  }
  const overlapIds=new Set<string>()
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
   const a=active[i],b=active[j]
   if(a.start_date<=b.end_date&&b.start_date<=a.end_date){overlapIds.add(a.id);overlapIds.add(b.id)}
  }
  if(overlapIds.size)issues.unshift({id:'overlaps',title:`${overlapIds.size} mission${overlapIds.size>1?'s':''} en chevauchement`,detail:'Deux périodes de mission se recouvrent. Vérifiez qu’il ne s’agit pas d’un doublon ou d’une situation volontaire.',kind:'warning'})
  return issues.slice(0,6)
 },[missions])

 const activeMissions=missions.filter(m=>m.status!=='cancelled')
 const overlapCount=missionIssues.find(i=>i.id==='overlaps')?Number(missionIssues.find(i=>i.id==='overlaps')?.title.match(/^\d+/)?.[0]??0):0
 const incompleteCount=missionIssues.filter(i=>i.id!=='overlaps').length
 const missingDistances=establishments.filter(e=>e.usual_distance_km==null).length
 const totalTrackedDays=estStats.reduce((s,e)=>s+e.days,0)

 if(!mount||!scope)return null
 return createPortal(<section className={`beta-operational-insights ${scope} ${mode}`} aria-label={scope==='establishments'?'Analyse Premium des établissements':'Contrôles Premium des missions'}>
  <div className="beta-operational-head"><div><span className="eyebrow">Suivi Premium</span><h2>{scope==='establishments'?'Analyse par établissement':'Contrôles de cohérence'}</h2></div><span className="beta-premium-badge">PREMIUM</span></div>
  {loading?<div className="beta-operational-loading">Analyse en cours…</div>:mode==='free'?<div className="beta-operational-lock"><strong>{scope==='establishments'?'Comprenez où vous remplacez le plus':'Repérez les missions à vérifier automatiquement'}</strong><p>{scope==='establishments'?'Premium consolide les jours, kilomètres, missions et indemnités estimées pour chaque établissement.':'Premium recherche les chevauchements et les informations manquantes qui peuvent fragiliser votre suivi.'}</p></div>:scope==='establishments'?<>
   <div className="beta-operational-kpis"><article><span>Établissements</span><strong>{establishments.length}</strong></article><article className={missingDistances?'attention':'ok'}><span>Distances à compléter</span><strong>{missingDistances}</strong></article><article><span>Jours suivis</span><strong>{totalTrackedDays}</strong></article></div>
   {estStats.length?<div className="beta-est-ranking">{estStats.map((est,index)=><article key={est.id}><b>{index+1}</b><div><strong>{est.name}</strong><small>{est.missions} mission(s) · {est.days} jour(s) · {est.km.toLocaleString('fr-FR',{maximumFractionDigits:1})} km</small></div><span>{euro(est.total)}</span></article>)}</div>:<div className="beta-operational-clear"><strong>Aucune donnée à analyser</strong><p>Les statistiques apparaîtront dès que des missions et journées seront rattachées à vos établissements.</p></div>}
  </>:<>
   <div className="beta-operational-kpis"><article><span>Missions suivies</span><strong>{activeMissions.length}</strong></article><article className={overlapCount?'attention':'ok'}><span>Chevauchements</span><strong>{overlapCount}</strong></article><article className={incompleteCount?'attention':'ok'}><span>Infos à compléter</span><strong>{incompleteCount}</strong></article></div>
   {missionIssues.length?<div className="beta-mission-issues">{missionIssues.map(issue=><article className={issue.kind} key={issue.id}><span className="beta-status-dot"/><div><strong>{issue.title}</strong><small>{issue.detail}</small></div></article>)}</div>:<div className="beta-operational-clear"><strong>Aucune anomalie détectée</strong><p>Les missions enregistrées ne présentent pas de chevauchement ni d’information essentielle manquante selon les contrôles de cette Beta.</p></div>}
   <p className="beta-operational-note">Ces contrôles servent d’aide à la vérification. Ils ne déterminent pas à eux seuls l’éligibilité réglementaire à une indemnité.</p>
  </>}
 </section>,mount)
}
