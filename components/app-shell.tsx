'use client'

import { useEffect, useMemo, useState } from 'react'
import IssrApp from '@/components/issr-app'
import BrandLogo from '@/components/brand-logo'
import { createClient } from '@/lib/supabase/client'
import { calcIndemKm, PRIME_REP_JOUR, PRIME_REPPLUS_JOUR, scheduleForDate, type IssrRateSchedule } from '@/lib/issr'

type EntrySummary={travel_date:string;distance_km:number;total_amount:number;rep_bonus:number;rep_plus_bonus:number}
type Establishment={id:string;name:string;address:string;is_rep:boolean;is_rep_plus:boolean;usual_distance_km:number|null;notes:string|null}
type Mission={id:string;title:string|null;start_date:string;end_date:string;status:string;establishment_id?:string|null;issr_establishments:{name:string}|null}
type View='dashboard'|'missions'|'indemnities'|'establishments'
type Props={userId:string;initialEntries:EntrySummary[];initialMissions:Mission[];initialEstablishments:Establishment[];initialDefaultOrigin:string;rateSchedules:IssrRateSchedule[]}

function weekdaysBetween(start:string,end:string){
 const out:string[]=[]
 const d=new Date(start+'T12:00:00'),stop=new Date(end+'T12:00:00')
 while(d<=stop){const day=d.getDay();if(day!==0&&day!==6)out.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
 return out
}
function frDate(date:string){return new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short'})}
function ProductHero({title,description,action}:{title:string;description:string;action?:React.ReactNode}){
 return <header className="product-hero"><div className="product-hero-copy"><BrandLogo inverse/><div className="product-hero-text"><h1>{title}</h1><p>{description}</p></div></div>{action}</header>
}

export default function AppShell({userId,initialEntries,initialMissions,initialEstablishments,initialDefaultOrigin,rateSchedules}:Props){
 const supabase=useMemo(()=>createClient(),[])
 const [view,setView]=useState<View>('dashboard'),[entries,setEntries]=useState(initialEntries),[missions,setMissions]=useState(initialMissions),[establishments,setEstablishments]=useState(initialEstablishments)
 const [name,setName]=useState(''),[address,setAddress]=useState(''),[rep,setRep]=useState(false),[repPlus,setRepPlus]=useState(false),[km,setKm]=useState('')
 const [estId,setEstId]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[title,setTitle]=useState(''),[message,setMessage]=useState('')
 const [defaultOrigin,setDefaultOrigin]=useState(initialDefaultOrigin),[generateDays,setGenerateDays]=useState(true),[busy,setBusy]=useState(false)
 const [schoolZone,setSchoolZone]=useState<'A'|'B'|'C'>('B'),[holidayDates,setHolidayDates]=useState<string[]>([]),[selectedDays,setSelectedDays]=useState<string[]>([]),[calendarLoading,setCalendarLoading]=useState(false)
 const month=new Date().toISOString().slice(0,7),today=new Date().toISOString().slice(0,10)
 const monthEntries=entries.filter(e=>e.travel_date.startsWith(month))
 const stats=monthEntries.reduce((a,e)=>({days:a.days+1,km:a.km+Number(e.distance_km),total:a.total+Number(e.total_amount),rep:a.rep+Number(e.rep_bonus)+Number(e.rep_plus_bonus)}),{days:0,km:0,total:0,rep:0})
 const nextMission=missions.filter(m=>m.end_date>=today&&m.status!=='cancelled').sort((a,b)=>a.start_date.localeCompare(b.start_date))[0]
 const selectedEst=establishments.find(e=>e.id===estId)
 const candidateDays=useMemo(()=>start&&end&&end>=start?weekdaysBetween(start,end):[],[start,end])
 const holidaySet=useMemo(()=>new Set(holidayDates),[holidayDates])

 useEffect(()=>{
  if(!start||!end||end<start){setHolidayDates([]);setSelectedDays([]);return}
  const ctrl=new AbortController();setCalendarLoading(true)
  fetch(`/api/school-calendar?zone=${schoolZone}&start=${start}&end=${end}`,{signal:ctrl.signal})
   .then(r=>r.ok?r.json():Promise.reject(new Error('Calendrier indisponible')))
   .then(j=>{const blocked=(j.blocked_dates??[]) as string[];setHolidayDates(blocked);setSelectedDays(candidateDays.filter(d=>!blocked.includes(d)))})
   .catch(()=>setSelectedDays(candidateDays))
   .finally(()=>setCalendarLoading(false))
  return()=>ctrl.abort()
 },[start,end,schoolZone,candidateDays])

 const preview=useMemo(()=>{
  if(!selectedEst||selectedEst.usual_distance_km==null)return {days:selectedDays.length,total:0}
  const distance=Number(selectedEst.usual_distance_km)
  return selectedDays.reduce((a,date)=>{const schedule=scheduleForDate(rateSchedules,date);if(!schedule)return a;const mileage=calcIndemKm(distance,schedule);const r=selectedEst.is_rep?PRIME_REP_JOUR:0;const rp=selectedEst.is_rep_plus?PRIME_REPPLUS_JOUR:0;return {days:a.days+1,total:a.total+mileage+r+rp}},{days:0,total:0})
 },[selectedDays,selectedEst,rateSchedules])

 function toggleDay(date:string){setSelectedDays(v=>v.includes(date)?v.filter(d=>d!==date):[...v,date].sort())}

 async function addEstablishment(){if(!name.trim()||!address.trim()){setMessage('Nom et adresse obligatoires.');return}const {data,error}=await supabase.from('issr_establishments').insert({user_id:userId,name:name.trim(),address:address.trim(),is_rep:rep,is_rep_plus:repPlus,usual_distance_km:km?Number(km):null}).select().single();if(error){setMessage(error.message);return}setEstablishments(v=>[...v,data as Establishment].sort((a,b)=>a.name.localeCompare(b.name)));setName('');setAddress('');setKm('');setRep(false);setRepPlus(false);setMessage('Établissement enregistré.')}

 async function addMission(){
  if(!estId||!start||!end){setMessage('Choisissez un établissement et une période.');return}
  if(end<start){setMessage('La date de fin doit être postérieure au début.');return}
  if(generateDays&&selectedEst?.usual_distance_km==null){setMessage('Ajoutez d’abord la distance habituelle de cet établissement.');return}
  if(generateDays&&!defaultOrigin.trim()){setMessage('Renseignez votre adresse de départ habituelle.');return}
  if(generateDays&&!selectedDays.length){setMessage('Sélectionnez au moins une journée travaillée.');return}
  setBusy(true);setMessage('')
  try{
   if(defaultOrigin.trim())await supabase.from('issr_user_settings').upsert({user_id:userId,default_origin:defaultOrigin.trim()},{onConflict:'user_id'})
   const {data,error}=await supabase.from('issr_missions').insert({user_id:userId,establishment_id:estId,title:title.trim()||null,start_date:start,end_date:end,status:start<=today&&end>=today?'active':'planned'}).select('id,title,start_date,end_date,status,establishment_id,issr_establishments(name)').single()
   if(error)throw error
   const mission=data as unknown as Mission;setMissions(v=>[...v,mission]);let generated:EntrySummary[]=[]
   if(generateDays&&selectedEst){
    const distance=Number(selectedEst.usual_distance_km)
    const rows=selectedDays.flatMap(date=>{const schedule=scheduleForDate(rateSchedules,date);if(!schedule)return [];const mileage=calcIndemKm(distance,schedule),repBonus=selectedEst.is_rep?PRIME_REP_JOUR:0,repPlusBonus=selectedEst.is_rep_plus?PRIME_REPPLUS_JOUR:0;return [{user_id:userId,mission_id:mission.id,generated_by_mission:true,travel_date:date,origin:defaultOrigin.trim(),destination:selectedEst.address,distance_km:distance,distance_source:'manual',is_rep:selectedEst.is_rep,is_rep_plus:selectedEst.is_rep_plus,mileage_allowance:mileage,rep_bonus:repBonus,rep_plus_bonus:repPlusBonus,total_amount:mileage+repBonus+repPlusBonus,rate_schedule_id:schedule.id,rate_code:schedule.code,rate_source_url:schedule.source_url}]})
    if(rows.length){const {data:created,error:entryError}=await supabase.from('issr_entries').insert(rows).select('travel_date,distance_km,total_amount,rep_bonus,rep_plus_bonus');if(entryError)throw entryError;generated=(created??[]) as EntrySummary[];setEntries(v=>[...generated,...v])}
   }
   setTitle('');setStart('');setEnd('');setEstId('');setHolidayDates([]);setSelectedDays([]);setMessage(generateDays?`Mission créée · ${generated.length} journée(s) ISSR générée(s).`:'Mission créée.')
  }catch(e:any){setMessage(e.message||'Impossible de créer la mission.')}finally{setBusy(false)}
 }
 async function removeEstablishment(id:string){const {error}=await supabase.from('issr_establishments').delete().eq('id',id);if(!error)setEstablishments(v=>v.filter(e=>e.id!==id));else setMessage('Cet établissement est peut-être encore lié à une mission.')}
 async function removeMission(id:string){setBusy(true);const {data:generated}=await supabase.from('issr_entries').select('travel_date').eq('mission_id',id);await supabase.from('issr_entries').delete().eq('mission_id',id).eq('generated_by_mission',true);const {error}=await supabase.from('issr_missions').delete().eq('id',id);if(!error){setMissions(v=>v.filter(m=>m.id!==id));const dates=new Set((generated??[]).map((x:any)=>x.travel_date));setEntries(v=>v.filter(e=>!dates.has(e.travel_date)))}setBusy(false)}

 const nav=<nav className="product-tabs"><button className={view==='dashboard'?'active':''} onClick={()=>setView('dashboard')}>Tableau de bord</button><button className={view==='establishments'?'active':''} onClick={()=>setView('establishments')}>Mes établissements</button><button className={view==='missions'?'active':''} onClick={()=>setView('missions')}>Mes missions</button><button className={view==='indemnities'?'active':''} onClick={()=>setView('indemnities')}>Mes indemnités</button><button disabled>Mes bilans</button><button disabled>Mes documents</button></nav>

 if(view==='indemnities')return <div className="product-shell"><ProductHero title="Mes indemnités" description="Contrôlez les journées générées par vos missions, corrigez un trajet si nécessaire et exportez vos justificatifs."/>{nav}<main className="dashboard-main indemnities-page"><section className="journey-strip"><span>1 · Établissements</span><b>→</b><span>2 · Missions</span><b>→</b><span className="active">3 · Indemnités</span><b>→</b><span>4 · Bilans</span><b>→</b><span>5 · Documents</span></section><div className="indemnities-embedded"><IssrApp userId={userId}/></div></main></div>

 if(view==='establishments')return <div className="product-shell"><ProductHero title="Mes établissements" description="Enregistrez une fois vos lieux de remplacement, puis réutilisez-les dans vos missions."/>{nav}<main className="dashboard-main"><section className="dashboard-panel"><span className="eyebrow">Étape 1</span><h2>Ajouter un établissement</h2><div className="mr-form"><label>Nom<input value={name} onChange={e=>setName(e.target.value)} placeholder="École, collège, lycée…"/></label><label>Adresse<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Adresse complète"/></label><label>Distance habituelle (km)<input type="number" min="0" step="0.1" value={km} onChange={e=>setKm(e.target.value)} placeholder="Distance de référence"/></label><div className="mr-checks"><label><input type="checkbox" checked={rep} onChange={e=>{setRep(e.target.checked);if(e.target.checked)setRepPlus(false)}}/> REP</label><label><input type="checkbox" checked={repPlus} onChange={e=>{setRepPlus(e.target.checked);if(e.target.checked)setRep(false)}}/> REP+</label></div><button className="btn btn-primary" onClick={addEstablishment}>Enregistrer</button></div>{message&&<p className="mr-message">{message}</p>}</section><section className="dashboard-panel"><h2>Établissements enregistrés</h2><div className="mr-list">{establishments.length?establishments.map(e=><article key={e.id}><div><strong>{e.name}</strong><span>{e.address}</span><small>{e.is_rep_plus?'REP+':e.is_rep?'REP':'Hors REP'}{e.usual_distance_km!=null?` · ${e.usual_distance_km} km`:' · distance à compléter'}</small></div><button className="btn btn-danger" onClick={()=>removeEstablishment(e.id)}>Supprimer</button></article>):<div className="empty-state">Aucun établissement enregistré.</div>}</div></section></main></div>

 if(view==='missions')return <div className="product-shell"><ProductHero title="Mes missions" description="Planifiez la période, vérifiez les jours réellement travaillés, puis validez l’estimation ISSR."/>{nav}<main className="dashboard-main"><section className="dashboard-panel"><span className="eyebrow">Étape 2</span><h2>Créer une mission</h2><div className="mr-form"><label>Établissement<select value={estId} onChange={e=>setEstId(e.target.value)}><option value="">Sélectionner…</option>{establishments.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>Libellé (facultatif)<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex : remplacement CM2"/></label><label>Du<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Au<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><label>Zone scolaire<select value={schoolZone} onChange={e=>setSchoolZone(e.target.value as 'A'|'B'|'C')}><option value="A">Zone A</option><option value="B">Zone B</option><option value="C">Zone C</option></select></label><label>Adresse de départ<input value={defaultOrigin} onChange={e=>setDefaultOrigin(e.target.value)} placeholder="Adresse habituelle"/></label><div className="mr-generate mr-wide"><label><input type="checkbox" checked={generateDays} onChange={e=>setGenerateDays(e.target.checked)}/> Générer automatiquement les indemnités pour les journées sélectionnées</label></div></div>
 {generateDays&&candidateDays.length>0&&<div className="mission-planner"><div className="planner-head"><div><strong>Jours travaillés</strong><span>{calendarLoading?'Vérification du calendrier scolaire…':`${selectedDays.length} sur ${candidateDays.length} jour(s) ouvré(s) retenu(s)`}</span></div><div><strong>{preview.total.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</strong><span>estimation avant validation</span></div></div><div className="day-grid">{candidateDays.map(d=>{const holiday=holidaySet.has(d),checked=selectedDays.includes(d);return <label key={d} className={`${checked?'selected':''} ${holiday?'holiday':''}`}><input type="checkbox" checked={checked} onChange={()=>toggleDay(d)}/><span>{frDate(d)}</span>{holiday&&<small>Vacances scolaires</small>}</label>})}</div><p className="planner-source">Week-ends exclus automatiquement. Les vacances sont vérifiées via le calendrier officiel du ministère de l’Éducation nationale pour la zone {schoolZone}. Vous pouvez réactiver ou décocher chaque journée manuellement.</p></div>}
 <button className="btn btn-primary" onClick={addMission} disabled={!establishments.length||busy}>{busy?'Création…':'Créer la mission et générer les ISSR'}</button>{!establishments.length&&<p className="mr-message">Ajoutez d’abord un établissement : il sera ensuite réutilisable pour toutes vos missions.</p>}{message&&<p className="mr-message">{message}</p>}</section><section className="dashboard-panel"><h2>Missions enregistrées</h2><div className="mr-list">{missions.length?[...missions].sort((a,b)=>b.start_date.localeCompare(a.start_date)).map(m=><article key={m.id}><div><strong>{m.issr_establishments?.name??m.title??'Mission'}</strong><span>Du {new Date(m.start_date+'T12:00:00').toLocaleDateString('fr-FR')} au {new Date(m.end_date+'T12:00:00').toLocaleDateString('fr-FR')}</span><small>{m.status==='active'?'En cours':m.status==='completed'?'Terminée':'Planifiée'}</small></div><button className="btn btn-danger" disabled={busy} onClick={()=>removeMission(m.id)}>Supprimer</button></article>):<div className="empty-state">Aucune mission enregistrée.</div>}</div></section></main></div>

 return <div className="product-shell"><ProductHero title="Bonjour 👋" description="Préparez d’abord vos établissements, puis créez vos missions et suivez vos indemnités." action={<button className="btn btn-primary" onClick={()=>setView(establishments.length?'missions':'establishments')}>{establishments.length?'+ Créer une mission':'+ Ajouter un établissement'}</button>}/>{nav}<main className="dashboard-main"><section className="journey-strip"><span className="active">1 · Établissements</span><b>→</b><span>2 · Missions</span><b>→</b><span>3 · Indemnités</span><b>→</b><span>4 · Bilans</span><b>→</b><span>5 · Documents</span></section><section className="dashboard-stats"><article><span>Jours déclarés</span><strong>{stats.days}</strong><small>ce mois</small></article><article><span>ISSR estimées</span><strong>{stats.total.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</strong><small>indemnités + primes</small></article><article><span>Distance</span><strong>{stats.km.toLocaleString('fr-FR',{maximumFractionDigits:1})} km</strong><small>trajets enregistrés</small></article><article><span>REP / REP+</span><strong>{stats.rep.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</strong><small>primes estimées</small></article></section><section className="dashboard-grid"><article className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">À venir</span><h2>Prochaine mission</h2></div><span className="status-chip">Planning</span></div>{nextMission?<div className="next-mission"><strong>{nextMission.issr_establishments?.name??nextMission.title??'Mission'}</strong><span>Du {new Date(nextMission.start_date+'T12:00:00').toLocaleDateString('fr-FR')} au {new Date(nextMission.end_date+'T12:00:00').toLocaleDateString('fr-FR')}</span></div>:<div className="empty-state"><strong>Aucune mission planifiée</strong><p>{establishments.length?'Votre établissement est prêt : vous pouvez maintenant créer une mission.':'Commencez par enregistrer un établissement. Il pourra ensuite être sélectionné dans toutes vos missions.'}</p></div>}</article><article className="dashboard-panel quick-panel"><div><span className="eyebrow">Accès rapide</span><h2>Par où commencer ?</h2></div><button onClick={()=>setView('establishments')}><span>🏫</span><div><strong>Mes établissements</strong><small>{establishments.length?`${establishments.length} enregistré(s)`:'Première étape obligatoire'}</small></div><b>→</b></button><button onClick={()=>setView('missions')} disabled={!establishments.length}><span>📅</span><div><strong>Mes missions</strong><small>{establishments.length?'Créer et planifier un remplacement':'Ajoutez d’abord un établissement'}</small></div><b>→</b></button><button onClick={()=>setView('indemnities')}><span>€</span><div><strong>Mes indemnités</strong><small>Contrôler ou corriger les calculs</small></div><b>→</b></button></article></section></main></div>
}
