'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcIndemKm, fmtDate, fmtEuro, PRIME_REP_JOUR, PRIME_REPPLUS_JOUR, scheduleForDate, type IssrRateSchedule } from '@/lib/issr'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import * as XLSX from 'xlsx'

type Entry = {
  id: string; user_id: string; travel_date: string; origin: string; destination: string; distance_km: number;
  is_rep: boolean; is_rep_plus: boolean; mileage_allowance: number; rep_bonus: number; rep_plus_bonus: number;
  total_amount: number; distance_source: 'osrm'|'manual'; created_at?: string;
  rate_schedule_id?: string|null; rate_code?: string|null; rate_source_url?: string|null
}
type Suggestion = { label:string; context:string; lon:number; lat:number }

export default function IssrApp({ userId, embedded=false }: { userId: string; embedded?: boolean }) {
  const supabase = useMemo(()=>createClient(), [])
  const [entries,setEntries]=useState<Entry[]>([])
  const [rateSchedules,setRateSchedules]=useState<IssrRateSchedule[]>([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [status,setStatus]=useState<{text:string;type:'success'|'error'}|null>(null)
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10))
  const [origine,setOrigine]=useState('')
  const [destination,setDestination]=useState('')
  const [manualKm,setManualKm]=useState('')
  const [isRep,setIsRep]=useState(false)
  const [isRepPlus,setIsRepPlus]=useState(false)
  const [selectedMonth,setSelectedMonth]=useState(()=>new Date().toISOString().slice(0,7))
  const [originSuggestions,setOriginSuggestions]=useState<Suggestion[]>([])
  const [destSuggestions,setDestSuggestions]=useState<Suggestion[]>([])
  const [originCoords,setOriginCoords]=useState<[number,number]|null>(null)
  const [destCoords,setDestCoords]=useState<[number,number]|null>(null)

  useEffect(()=>{ loadInitialData() },[])
  async function loadInitialData(){ await Promise.all([loadEntries(), loadRateSchedules()]) }
  async function loadRateSchedules(){
    const {data,error}=await supabase.from('issr_rate_schedules').select('*').eq('is_official',true).order('valid_from',{ascending:false})
    if(error) setStatus({text:`Barèmes ISSR : ${error.message}`,type:'error'}); else setRateSchedules((data??[]) as IssrRateSchedule[])
  }
  async function loadEntries(){
    setLoading(true)
    const {data,error}=await supabase.from('issr_entries').select('*').order('travel_date',{ascending:false}).order('created_at',{ascending:false})
    if(error) setStatus({text:error.message,type:'error'}); else setEntries((data??[]) as Entry[])
    setLoading(false)
  }

  useEffect(()=>{ const t=setTimeout(()=>autocomplete(origine,setOriginSuggestions),350); return()=>clearTimeout(t) },[origine])
  useEffect(()=>{ const t=setTimeout(()=>autocomplete(destination,setDestSuggestions),350); return()=>clearTimeout(t) },[destination])
  async function autocomplete(q:string,setter:(v:Suggestion[])=>void){
    if(q.trim().length<3){setter([]);return}
    try{ const r=await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`); const j=await r.json(); setter((j.features??[]).map((f:any)=>({label:f.properties.label,context:f.properties.context??'',lon:f.geometry.coordinates[0],lat:f.geometry.coordinates[1]}))) }catch{setter([])}
  }
  async function geocode(address:string):Promise<[number,number]>{
    const r=await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`); if(!r.ok) throw new Error('Erreur de géocodage')
    const j=await r.json(); if(!j.features?.length) throw new Error(`Adresse introuvable : ${address}`)
    return [j.features[0].geometry.coordinates[0],j.features[0].geometry.coordinates[1]]
  }
  async function routeKm(a:[number,number],b:[number,number]){
    const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=false&alternatives=false`); if(!r.ok) throw new Error('Erreur de calcul OSRM')
    const j=await r.json(); if(j.code!=='Ok'||!j.routes?.length) throw new Error('Itinéraire introuvable')
    return Math.round(j.routes[0].distance/100)/10
  }

  async function addEntry(){
    if(!date||!origine.trim()||!destination.trim()){setStatus({text:'Renseigne la date et les deux adresses.',type:'error'});return}
    setSaving(true); setStatus(null)
    try{
      const manual=manualKm.trim()!==''&&!Number.isNaN(Number(manualKm))
      const km=manual?Number(manualKm):await routeKm(originCoords??await geocode(origine),destCoords??await geocode(destination))
      if(km<0) throw new Error('Le kilométrage doit être positif.')
      const schedule=scheduleForDate(rateSchedules,date)
      if(!schedule) throw new Error('Aucun barème ISSR officiel n’est disponible pour cette date.')
      const indem=calcIndemKm(km,schedule), rep=isRep?PRIME_REP_JOUR:0, repPlus=isRepPlus?PRIME_REPPLUS_JOUR:0, total=indem+rep+repPlus
      const row={user_id:userId,travel_date:date,origin:origine.trim(),destination:destination.trim(),distance_km:km,is_rep:isRep,is_rep_plus:isRepPlus,mileage_allowance:indem,rep_bonus:rep,rep_plus_bonus:repPlus,total_amount:total,distance_source:manual?'manual':'osrm',rate_schedule_id:schedule.id,rate_code:schedule.code,rate_source_url:schedule.source_url}
      const {data,error}=await supabase.from('issr_entries').insert(row).select().single(); if(error) throw error
      setEntries(v=>[data as Entry,...v]); setStatus({text:`${manual?'Manuel':'Calculé'} : ${km} km — ${fmtEuro(total)} · ${schedule.code}`,type:'success'})
      setOrigine('');setDestination('');setManualKm('');setIsRep(false);setIsRepPlus(false);setOriginCoords(null);setDestCoords(null);setOriginSuggestions([]);setDestSuggestions([])
    }catch(e:any){setStatus({text:e.message||'Erreur lors de l’ajout.',type:'error'})}finally{setSaving(false)}
  }
  async function removeEntry(id:string){ const {error}=await supabase.from('issr_entries').delete().eq('id',id); if(error)setStatus({text:error.message,type:'error'}); else setEntries(v=>v.filter(e=>e.id!==id)) }
  async function signOut(){await supabase.auth.signOut();window.location.href='/login'}

  const filtered=useMemo(()=>selectedMonth?entries.filter(e=>e.travel_date.startsWith(selectedMonth)):entries,[entries,selectedMonth])
  const sums=useMemo(()=>filtered.reduce((a,e)=>({jours:a.jours+1,distance:a.distance+Number(e.distance_km),km:a.km+Number(e.mileage_allowance),rep:a.rep+Number(e.rep_bonus),repPlus:a.repPlus+Number(e.rep_plus_bonus),total:a.total+Number(e.total_amount)}),{jours:0,distance:0,km:0,rep:0,repPlus:0,total:0}),[filtered])
  const globalTotal=useMemo(()=>entries.reduce((a,e)=>a+Number(e.total_amount),0),[entries])
  const activeSchedule=useMemo(()=>scheduleForDate(rateSchedules,date),[rateSchedules,date])
  const exportName=`ISSR_${selectedMonth||'toutes-periodes'}`
  function csvEscape(v:unknown){return `"${String(v??'').replaceAll('"','""')}"`}
  function exportCSV(){ if(!filtered.length)return; const head=['N°','Date','Origine','Destination','Km','REP','REP+','Indem. km','Prime REP','Prime REP+','Total']; const rows=filtered.map((e,i)=>[i+1,fmtDate(e.travel_date),e.origin,e.destination,e.distance_km,e.is_rep?'X':'',e.is_rep_plus?'X':'',Number(e.mileage_allowance).toFixed(2),Number(e.rep_bonus).toFixed(2),Number(e.rep_plus_bonus).toFixed(2),Number(e.total_amount).toFixed(2)]); const total=['','','','','','','','','','TOTAL',sums.total.toFixed(2)]; const csv=[head,...rows,total].map(r=>r.map(csvEscape).join(';')).join('\n'); downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),`${exportName}.csv`) }
  function exportExcel(){ if(!filtered.length)return; const data:Array<Record<string,string|number>>=filtered.map((e,i)=>({'N°':i+1,'Date':fmtDate(e.travel_date),'Origine':e.origin,'Destination':e.destination,'Km':e.distance_km,'REP':e.is_rep?'X':'','REP+':e.is_rep_plus?'X':'','Indem. km':Number(e.mileage_allowance),'Prime REP':Number(e.rep_bonus),'Prime REP+':Number(e.rep_plus_bonus),'Total':Number(e.total_amount)})); data.push({'N°':'','Date':'','Origine':'','Destination':'','Km':'','REP':'','REP+':'','Indem. km':'','Prime REP':'','Prime REP+':'TOTAL','Total':sums.total}); const ws=XLSX.utils.json_to_sheet(data); ws['!cols']=[{wch:5},{wch:12},{wch:35},{wch:35},{wch:8},{wch:7},{wch:7},{wch:12},{wch:12},{wch:12},{wch:12}]; const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'ISSR');XLSX.writeFile(wb,`${exportName}.xlsx`) }
  function exportPDF(){ if(!filtered.length)return; const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); doc.setFillColor(42,59,42);doc.rect(0,0,297,22,'F');doc.setTextColor(232,228,212);doc.setFontSize(18);doc.text('Récapitulatif ISSR',14,14);doc.setTextColor(44,36,22);doc.setFontSize(10);doc.text(`Période : ${selectedMonth||'Toutes les périodes'}  •  ${filtered.length} jour(s)`,14,30); autoTable(doc,{startY:35,head:[['N°','Date','Origine','Destination','Km','REP','REP+','Indem. km','Prime REP','Prime REP+','Total']],body:filtered.map((e,i)=>[i+1,fmtDate(e.travel_date),e.origin,e.destination,e.distance_km,e.is_rep?'REP':'—',e.is_rep_plus?'REP+':'—',fmtEuro(Number(e.mileage_allowance)),Number(e.rep_bonus)>0?fmtEuro(Number(e.rep_bonus)):'—',Number(e.rep_plus_bonus)>0?fmtEuro(Number(e.rep_plus_bonus)):'—',fmtEuro(Number(e.total_amount))]),styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[42,59,42],textColor:[232,228,212]},columnStyles:{2:{cellWidth:48},3:{cellWidth:48},10:{fontStyle:'bold'}},margin:{left:10,right:10}}); const y=(doc as any).lastAutoTable.finalY+8;doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text(`Indemnités km : ${fmtEuro(sums.km)}   |   REP : ${fmtEuro(sums.rep)}   |   REP+ : ${fmtEuro(sums.repPlus)}   |   TOTAL : ${fmtEuro(sums.total)}`,14,y); doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text('Les distances OSRM peuvent différer du référentiel ARIA. Utiliser la saisie manuelle pour reprendre le kilométrage officiel.',14,y+7); doc.save(`${exportName}.pdf`) }
  function downloadBlob(blob:Blob,name:string){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}

  return <>
    {!embedded&&<header className="header"><div className="header-content"><div className="badge">Mon Remplacement</div><h1>Mes indemnités</h1><p>Suivez et contrôlez vos indemnités de remplacement.</p><div className="header-actions"><button className="btn btn-ghost" onClick={signOut}>Déconnexion</button></div></div></header>}
    <main className={embedded?'main indemnities-main':'main'}>
      <section className="indemnity-summary">
        <article><span>Jours indemnisés</span><strong>{sums.jours}</strong><small>sur la période sélectionnée</small></article>
        <article><span>Total estimé</span><strong>{fmtEuro(sums.total)}</strong><small>ISSR + primes</small></article>
        <article><span>Distance cumulée</span><strong>{sums.distance.toLocaleString('fr-FR',{maximumFractionDigits:1})} km</strong><small>déplacements enregistrés</small></article>
        <article><span>REP / REP+</span><strong>{fmtEuro(sums.rep+sums.repPlus)}</strong><small>primes estimées</small></article>
      </section>

      <section className="card table-section indemnity-list"><div className="table-header"><div><span className="eyebrow">Suivi</span><h2>Mes journées indemnisées</h2></div><div className="table-tools"><div className="filter-box"><label className="filter-label">Mois</label><input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}/></div><button className="btn btn-export" onClick={exportExcel}>Excel</button><button className="btn btn-export" onClick={exportPDF}>PDF</button></div></div>
      {loading?<div className="loading-screen">Chargement des indemnités…</div>:filtered.length===0?<div className="empty-state"><strong>Aucune indemnité pour cette période</strong><p>Les journées créées depuis vos missions apparaîtront automatiquement ici.</p></div>:<><div className="table-wrapper"><table className="desktop-table"><thead><tr><th>Date</th><th>Origine</th><th>Établissement</th><th>Distance</th><th>ISSR</th><th>REP / REP+</th><th>Total</th><th></th></tr></thead><tbody>{filtered.map(e=><tr key={e.id}><td>{fmtDate(e.travel_date)}</td><td>{e.origin}</td><td>{e.destination}</td><td className="td-km">{e.distance_km} km</td><td className="td-amount">{fmtEuro(Number(e.mileage_allowance))}</td><td className="td-amount">{Number(e.rep_bonus)+Number(e.rep_plus_bonus)>0?fmtEuro(Number(e.rep_bonus)+Number(e.rep_plus_bonus)):'—'}</td><td className="td-total">{fmtEuro(Number(e.total_amount))}</td><td><button className="btn btn-danger" onClick={()=>removeEntry(e.id)} title="Supprimer cette journée">✕</button></td></tr>)}</tbody></table></div><div className="mobile-list">{filtered.map(e=><article className="mobile-entry" key={e.id}><div className="mobile-entry-head"><strong>{fmtDate(e.travel_date)}</strong><strong>{fmtEuro(Number(e.total_amount))}</strong></div><div className="mobile-entry-route">{e.destination}</div><div className="mobile-entry-meta"><span className="km-pill">{e.distance_km} km</span>{e.is_rep&&<span className="tag tag-rep">REP</span>}{e.is_rep_plus&&<span className="tag tag-repplus">REP+</span>}</div><button className="btn btn-danger" onClick={()=>removeEntry(e.id)}>Supprimer</button></article>)}</div></>}
      </section>

      <details className="card indemnity-manual"><summary><span><strong>+ Ajouter une indemnité manuellement</strong><small>Pour un cas particulier ou une correction hors mission</small></span></summary><div className="add-section"><div className="form-grid">
        <div className="form-group"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="form-group"><label>Adresse d'origine</label><div className="ac-wrapper"><input type="text" value={origine} onChange={e=>{setOrigine(e.target.value);setOriginCoords(null)}} placeholder="Adresse de départ"/>{originSuggestions.length>0&&<div className="ac-dropdown">{originSuggestions.map((s,i)=><div className="ac-item" key={i} onClick={()=>{setOrigine(s.label);setOriginCoords([s.lon,s.lat]);setOriginSuggestions([])}}><strong>{s.label}</strong><div className="ac-sub">{s.context}</div></div>)}</div>}</div></div>
        <div className="form-group"><label>Établissement / destination</label><div className="ac-wrapper"><input type="text" value={destination} onChange={e=>{setDestination(e.target.value);setDestCoords(null)}} placeholder="Adresse de remplacement"/>{destSuggestions.length>0&&<div className="ac-dropdown">{destSuggestions.map((s,i)=><div className="ac-item" key={i} onClick={()=>{setDestination(s.label);setDestCoords([s.lon,s.lat]);setDestSuggestions([])}}><strong>{s.label}</strong><div className="ac-sub">{s.context}</div></div>)}</div>}</div></div>
        <div className="form-group"><label>Distance officielle (km, facultatif)</label><input type="number" min="0" step="0.1" value={manualKm} onChange={e=>setManualKm(e.target.value)} placeholder="Calcul automatique si vide"/></div>
        <div className="checkbox-group"><label>REP</label><input type="checkbox" checked={isRep} onChange={e=>setIsRep(e.target.checked)}/></div>
        <div className="checkbox-group repplus"><label>REP+</label><input type="checkbox" checked={isRepPlus} onChange={e=>setIsRepPlus(e.target.checked)}/></div>
        <button className="btn btn-primary" onClick={addEntry} disabled={saving}>{saving?'Calcul…':'Ajouter cette indemnité'}</button>
      </div>{status&&<div className={`status-msg ${status.type==='error'?'status-error':'status-success'}`}>{status.text}</div>}<div className="hint">Si la distance est laissée vide, l’itinéraire est calculé automatiquement. Vous pouvez saisir le kilométrage officiel pour le reprendre tel quel.</div></div></details>

      <details className="card indemnity-info"><summary><span><strong>Comprendre le calcul</strong><small>Barème officiel, moteur de distance et grille ISSR</small></span></summary><div className="indemnity-info-body"><div className="api-section"><strong>Moteur de distance :</strong><span> OSRM · géocodage BAN</span></div><div className="api-section"><strong>Barème officiel :</strong>{activeSchedule?<><span> {activeSchedule.code}</span><div className="api-hint">{activeSchedule.title} · source <a href={activeSchedule.source_url} target="_blank" rel="noreferrer">Légifrance</a>{activeSchedule.source_nor?` · NOR ${activeSchedule.source_nor}`:''}.</div></>:<span>Aucun barème pour la date sélectionnée.</span>}</div>{activeSchedule&&<div className="ref-table"><table><thead><tr><th>Tranche kilométrique</th><th>Montant</th></tr></thead><tbody>{activeSchedule.brackets.map((g,i)=><tr key={i}><td>{i===0?'Moins de 10 km':i===activeSchedule.brackets.length-1?'De 60 à 80 km':`De ${Math.trunc(g.min)} à ${Math.trunc(g.max)} km`}</td><td>{fmtEuro(Number(g.amount))}</td></tr>)}<tr><td>Par tranche suppl. de 20 km</td><td>+{fmtEuro(Number(activeSchedule.extra_20km))}</td></tr></tbody></table></div>}</div></details>

      <div className="indemnity-footer"><span>Total enregistré toutes périodes : <strong>{fmtEuro(globalTotal)}</strong></span><button className="btn btn-export" onClick={exportCSV}>Exporter en CSV</button></div>
    </main>
  </>
}
