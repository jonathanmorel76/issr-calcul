'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import useBetaProductMode from '@/components/use-beta-product-mode'

type Entry={travel_date:string;total_amount:number}
type Payment={id:string;payment_month:string;received_amount:number;note:string|null;source_document_id:string|null}
type Doc={id:string;title:string;category:string;file_name:string}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

export default function PaymentsView({userId}:{userId:string}){
 const supabase=useMemo(()=>createClient(),[])
 const premium=useBetaProductMode()==='premium'
 const currentMonth=new Date().toISOString().slice(0,7)
 const [month,setMonth]=useState(currentMonth),[entries,setEntries]=useState<Entry[]>([]),[payments,setPayments]=useState<Payment[]>([]),[docs,setDocs]=useState<Doc[]>([])
 const [received,setReceived]=useState(''),[note,setNote]=useState(''),[documentId,setDocumentId]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 useEffect(()=>{let live=true;(async()=>{setLoading(true);const [e,p,d]=await Promise.all([
  supabase.from('issr_entries').select('travel_date,total_amount').order('travel_date'),
  supabase.from('issr_payments').select('id,payment_month,received_amount,note,source_document_id').order('payment_month',{ascending:false}),
  supabase.from('issr_documents').select('id,title,category,file_name').eq('category','fiche_paie').order('created_at',{ascending:false})
 ]);if(!live)return;setEntries((e.data??[]) as Entry[]);setPayments((p.data??[]) as Payment[]);setDocs((d.data??[]) as Doc[]);setLoading(false)})();return()=>{live=false}},[supabase,userId])
 const expected=useMemo(()=>entries.filter(e=>e.travel_date.startsWith(month)).reduce((s,e)=>s+Number(e.total_amount),0),[entries,month])
 const payment=useMemo(()=>payments.find(p=>p.payment_month.slice(0,7)===month),[payments,month])
 const receivedAmount=payment?Number(payment.received_amount):0
 const difference=payment?receivedAmount-expected:null
 useEffect(()=>{setReceived(payment?String(Number(payment.received_amount)):'');setNote(payment?.note??'');setDocumentId(payment?.source_document_id??'')},[payment])
 async function save(){if(!premium){setMessage('Le suivi des versements et le rapprochement sont réservés à Premium.');return}const amount=Number(received.replace(',','.'));if(Number.isNaN(amount)||amount<0){setMessage('Saisissez un montant reçu valide.');return}setBusy(true);setMessage('');const row={user_id:userId,payment_month:`${month}-01`,received_amount:amount,note:note.trim()||null,source_document_id:documentId||null};const {data,error}=await supabase.from('issr_payments').upsert(row,{onConflict:'user_id,payment_month'}).select('id,payment_month,received_amount,note,source_document_id').single();setBusy(false);if(error){setMessage(error.message);return}const saved=data as Payment;setPayments(v=>[saved,...v.filter(p=>p.id!==saved.id&&p.payment_month!==saved.payment_month)]);setMessage('Versement enregistré et rapproché avec les indemnités estimées.')}
 return <main className="dashboard-main reports-page payments-page">
  <section className="report-period"><label>Mois à contrôler<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><span>{premium?'Comparez vos droits estimés au montant réellement versé.':'Aperçu Premium · activez Premium dans la Beta pour enregistrer un versement.'}</span></section>
  {loading?<div className="dashboard-panel report-loading-skeleton">Chargement du rapprochement…</div>:<>
   <section className="report-kpis payment-kpis"><article><span>Montant attendu</span><strong>{euro(expected)}</strong><small>D'après vos journées ISSR</small></article><article><span>Montant reçu</span><strong>{payment?euro(receivedAmount):'—'}</strong><small>{payment?'Versement déclaré':'Aucun versement saisi'}</small></article><article><span>Écart</span><strong>{difference===null?'—':`${difference>0?'+':''}${euro(difference)}`}</strong><small>{difference===null?'À renseigner':Math.abs(difference)<0.01?'Conforme':difference<0?'Montant potentiellement manquant':'Montant supérieur à l’estimation'}</small></article></section>
   <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Rapprochement</span><h2>Déclarer le versement reçu</h2></div>{!premium&&<span className="tag">Premium</span>}</div><div className="mr-form"><label>Montant reçu (€)<input inputMode="decimal" value={received} onChange={e=>setReceived(e.target.value)} placeholder="Ex : 319,68" disabled={!premium}/></label><label>Fiche de paie associée<select value={documentId} onChange={e=>setDocumentId(e.target.value)} disabled={!premium}><option value="">Aucune fiche de paie</option>{docs.map(d=><option value={d.id} key={d.id}>{d.title||d.file_name}</option>)}</select></label><label className="mr-wide">Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex : ISSR versées avec un mois de décalage" disabled={!premium}/></label><button className="btn btn-primary" onClick={save} disabled={!premium||busy}>{busy?'Enregistrement…':'Enregistrer et comparer'}</button></div>{message&&<p className="mr-message">{message}</p>}</section>
   {difference!==null&&difference< -0.01&&<section className="dashboard-panel premium-locked-panel"><span className="eyebrow">À vérifier</span><h2>{euro(Math.abs(difference))} potentiellement manquants</h2><p>Le montant déclaré comme reçu est inférieur à l'estimation calculée pour {monthLabel(month)}. Vérifiez la fiche de paie associée et les journées du mois avant toute demande de régularisation.</p></section>}
  </>}
 </main>
}
