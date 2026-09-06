'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import * as XLSX from 'xlsx'

type Entry={travel_date:string;distance_km:number;total_amount:number;rep_bonus:number;rep_plus_bonus:number;destination:string}
type Mission={id:string;start_date:string;end_date:string;status:string;issr_establishments:{name:string}|null}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function schoolYearFor(date:string){const d=new Date(`${date}T12:00:00`);const y=d.getFullYear();return d.getMonth()>=8?`${y}-${y+1}`:`${y-1}-${y}`}
function schoolYearBounds(year:string){const start=Number(year.slice(0,4));return {start:`${start}-09-01`,end:`${start+1}-08-31`}}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

export default function BilansView({userId}:{userId:string}){
 const supabase=useMemo(()=>createClient(),[])
 const [entries,setEntries]=useState<Entry[]>([]),[missions,setMissions]=useState<Mission[]>([]),[loading,setLoading]=useState(true)
 const currentYear=schoolYearFor(new Date().toISOString().slice(0,10))
 const [selectedYear,setSelectedYear]=useState(currentYear)
 useEffect(()=>{let live=true;(async()=>{setLoading(true);const [e,m]=await Promise.all([
  supabase.from('issr_entries').select('travel_date,distance_km,total_amount,rep_bonus,rep_plus_bonus,destination').order('travel_date'),
  supabase.from('issr_missions').select('id,start_date,end_date,status,issr_establishments(name)').order('start_date')
 ]);if(!live)return;setEntries((e.data??[]) as Entry[]);setMissions((m.data??[]) as unknown as Mission[]);setLoading(false)})();return()=>{live=false}},[supabase,userId])
 const years=useMemo(()=>{const values=new Set<string>([currentYear]);entries.forEach(e=>values.add(schoolYearFor(e.travel_date)));missions.forEach(m=>values.add(schoolYearFor(m.start_date)));return [...values].sort().reverse()},[entries,missions,currentYear])
 const {start,end}=schoolYearBounds(selectedYear)
 const yearEntries=entries.filter(e=>e.travel_date>=start&&e.travel_date<=end)
 const yearMissions=missions.filter(m=>m.status!=='cancelled'&&m.start_date<=end&&m.end_date>=start)
 const totals=yearEntries.reduce((a,e)=>({days:a.days+1,km:a.km+Number(e.distance_km),total:a.total+Number(e.total_amount),rep:a.rep+Number(e.rep_bonus)+Number(e.rep_plus_bonus)}),{days:0,km:0,total:0,rep:0})
 const monthly=useMemo(()=>{const map=new Map<string,{month:string;days:number;km:number;total:number;rep:number}>();for(const e of yearEntries){const key=e.travel_date.slice(0,7),row=map.get(key)??{month:key,days:0,km:0,total:0,rep:0};row.days++;row.km+=Number(e.distance_km);row.total+=Number(e.total_amount);row.rep+=Number(e.rep_bonus)+Number(e.rep_plus_bonus);map.set(key,row)}return [...map.values()].sort((a,b)=>a.month.localeCompare(b.month))},[yearEntries])
 const establishments=useMemo(()=>{const map=new Map<string,{name:string;days:number;total:number}>();for(const e of yearEntries){const name=e.destination||'Établissement non renseigné',row=map.get(name)??{name,days:0,total:0};row.days++;row.total+=Number(e.total_amount);map.set(name,row)}return [...map.values()].sort((a,b)=>b.days-a.days).slice(0,5)},[yearEntries])
 function exportExcel(){const rows=monthly.map(r=>({Mois:monthLabel(r.month),'Jours indemnisés':r.days,'Distance (km)':Number(r.km.toFixed(1)),'REP / REP+':Number(r.rep.toFixed(2)),'Total':Number(r.total.toFixed(2))}));const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=[{wch:20},{wch:18},{wch:16},{wch:14},{wch:14}];XLSX.utils.book_append_sheet(wb,ws,'Bilan');XLSX.writeFile(wb,`Bilan_remplacements_${selectedYear}.xlsx`)}
 function exportPDF(){const doc=new jsPDF({unit:'mm',format:'a4'});doc.setFontSize(19);doc.text(`Bilan de remplacement ${selectedYear}`,14,18);doc.setFontSize(10);doc.text(`${totals.days} jours · ${totals.km.toLocaleString('fr-FR',{maximumFractionDigits:1})} km · ${euro(totals.total)}`,14,27);autoTable(doc,{startY:34,head:[['Mois','Jours','Distance','REP / REP+','Total']],body:monthly.map(r=>[monthLabel(r.month),r.days,`${r.km.toLocaleString('fr-FR',{maximumFractionDigits:1})} km`,euro(r.rep),euro(r.total)]),styles:{fontSize:9},headStyles:{fillColor:[26,92,98]}});doc.save(`Bilan_remplacements_${selectedYear}.pdf`)}
 return <main className="dashboard-main reports-page">
  <section className="report-period"><label>Année scolaire<select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)}>{years.map(y=><option key={y} value={y}>{y.replace('-', ' – ')}</option>)}</select></label><span>Du 1er septembre {selectedYear.slice(0,4)} au 31 août {selectedYear.slice(5)}</span></section>
  {loading?<div className="dashboard-panel">Chargement du bilan…</div>:<>
   <section className="report-kpis"><article><span>Jours indemnisés</span><strong>{totals.days}</strong></article><article><span>Missions</span><strong>{yearMissions.length}</strong></article><article><span>Distance cumulée</span><strong>{totals.km.toLocaleString('fr-FR',{maximumFractionDigits:1})} km</strong></article><article><span>Indemnités estimées</span><strong>{euro(totals.total)}</strong><small>dont {euro(totals.rep)} de REP / REP+</small></article></section>
   <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Synthèse</span><h2>Évolution mensuelle</h2></div><div className="report-actions"><button className="btn btn-export" onClick={exportExcel} disabled={!monthly.length}>Excel</button><button className="btn btn-export" onClick={exportPDF} disabled={!monthly.length}>PDF</button></div></div>{monthly.length?<div className="report-months">{monthly.map(r=><article key={r.month}><div><strong>{monthLabel(r.month)}</strong><small>{r.days} jour(s) · {r.km.toLocaleString('fr-FR',{maximumFractionDigits:1})} km</small></div><strong>{euro(r.total)}</strong></article>)}</div>:<div className="empty-state">Aucune journée indemnisée sur cette année scolaire.</div>}</section>
   <section className="dashboard-panel report-panel"><span className="eyebrow">Lieux</span><h2>Établissements les plus fréquents</h2>{establishments.length?<div className="report-ranking">{establishments.map((e,i)=><article key={e.name}><b>{i+1}</b><div><strong>{e.name}</strong><small>{e.days} journée(s)</small></div><span>{euro(e.total)}</span></article>)}</div>:<div className="empty-state">Aucun établissement à synthétiser.</div>}</section>
  </>}
 </main>
}
