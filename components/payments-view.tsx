'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import useBetaProductMode from '@/components/use-beta-product-mode'

type Entry={travel_date:string;total_amount:number}
type Payment={id:string;payment_month:string;entitlement_month:string;received_amount:number;note:string|null;source_document_id:string|null}
type Doc={id:string;title:string;category:string;file_name:string}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function monthLabel(value:string){return new Date(`${value.slice(0,7)}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

export default function PaymentsView({userId}:{userId:string}){
 const supabase=useMemo(()=>createClient(),[])
 const premium=useBetaProductMode()==='premium'
 const currentMonth=new Date().toISOString().slice(0,7)
 const [entitlementMonth,setEntitlementMonth]=useState(currentMonth),[paymentMonth,setPaymentMonth]=useState(currentMonth)
 const [entries,setEntries]=useState<Entry[]>([]),[payments,setPayments]=useState<Payment[]>([]),[docs,setDocs]=useState<Doc[]>([])
 const [received,setReceived]=useState(''),[note,setNote]=useState(''),[documentId,setDocumentId]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 useEffect(()=>{let live=true;(async()=>{setLoading(true);const [e,p,d]=await Promise.all([
  supabase.from('issr_entries').select('travel_date,total_amount').order('travel_date'),
  supabase.from('issr_payments').select('id,payment_month,entitlement_month,received_amount,note,source_document_id').order('payment_month',{ascending:false}),
  supabase.from('issr_documents').select('id,title,category,file_name').eq('category','fiche_paie').order('created_at',{ascending:false})
 ]);if(!live)return;setEntries((e.data??[]) as Entry[]);setPayments((p.data??[]) as Payment[]);setDocs((d.data??[]) as Doc[]);setLoading(false)})();return()=>{live=false}},[supabase,userId])
 const expected=useMemo(()=>entries.filter(e=>e.travel_date.startsWith(entitlementMonth)).reduce((s,e)=>s+Number(e.total_amount),0),[entries,entitlementMonth])
 const allocations=useMemo(()=>payments.filter(p=>p.entitlement_month.slice(0,7)===entitlementMonth),[payments,entitlementMonth])
 const receivedTotal=useMemo(()=>allocations.reduce((sum,p)=>sum+Number(p.received_amount),0),[allocations])
 const difference=allocations.length?receivedTotal-expected:null
 const currentAllocation=useMemo(()=>allocations.find(p=>p.payment_month.slice(0,7)===paymentMonth),[allocations,paymentMonth])
 useEffect(()=>{setReceived(currentAllocation?String(Number(currentAllocation.received_amount)):'');setNote(currentAllocation?.note??'');setDocumentId(currentAllocation?.source_document_id??'')},[currentAllocation])
 async function save(){
  if(!premium){setMessage('Le suivi des versements et le rapprochement sont réservés à Premium.');return}
  const amount=Number(received.replace(',','.'))
  if(Number.isNaN(amount)||amount<0){setMessage('Saisissez un montant reçu valide.');return}
  setBusy(true);setMessage('')
  const row={user_id:userId,payment_month:`${paymentMonth}-01`,entitlement_month:`${entitlementMonth}-01`,received_amount:amount,note:note.trim()||null,source_document_id:documentId||null}
  const {data,error}=await supabase.from('issr_payments').upsert(row,{onConflict:'user_id,payment_month,entitlement_month'}).select('id,payment_month,entitlement_month,received_amount,note,source_document_id').single()
  setBusy(false)
  if(error){setMessage(error.message);return}
  const saved=data as Payment
  setPayments(v=>[saved,...v.filter(p=>p.id!==saved.id&&!(p.payment_month===saved.payment_month&&p.entitlement_month===saved.entitlement_month))])
  setMessage(paymentMonth===entitlementMonth?'Versement enregistré et rapproché avec les droits du même mois.':`Versement de ${monthLabel(paymentMonth)} affecté aux droits de ${monthLabel(entitlementMonth)}.`)
 }
 async function remove(payment:Payment){
  if(!premium||!window.confirm(`Supprimer l’affectation de ${euro(Number(payment.received_amount))} versée en ${monthLabel(payment.payment_month)} ?`))return
  setBusy(true);const {error}=await supabase.from('issr_payments').delete().eq('id',payment.id);setBusy(false)
  if(error){setMessage(error.message);return}
  setPayments(v=>v.filter(p=>p.id!==payment.id));setMessage('Affectation supprimée.')
 }
 return <main className="dashboard-main reports-page payments-page">
  <section className="report-period"><label>Mois des droits à contrôler<input type="month" value={entitlementMonth} onChange={e=>setEntitlementMonth(e.target.value)}/></label><span>{premium?'Les versements peuvent provenir d’une paie ultérieure : comparez les droits du mois aux sommes qui leur ont réellement été affectées.':'Aperçu Premium · activez Premium dans la Beta pour enregistrer et affecter les versements.'}</span></section>
  {loading?<div className="dashboard-panel report-loading-skeleton">Chargement du rapprochement…</div>:<>
   <section className="report-kpis payment-kpis"><article><span>Droits estimés</span><strong>{euro(expected)}</strong><small>{monthLabel(entitlementMonth)}</small></article><article><span>Déjà rapproché</span><strong>{allocations.length?euro(receivedTotal):'—'}</strong><small>{allocations.length?`${allocations.length} versement${allocations.length>1?'s':''} affecté${allocations.length>1?'s':''}`:'Aucun versement affecté'}</small></article><article><span>Reste à vérifier</span><strong>{difference===null?'—':euro(Math.max(0,-difference))}</strong><small>{difference===null?'À renseigner':Math.abs(difference)<0.01?'Droits rapprochés':difference<0?'Montant encore non rapproché':'Versement supérieur à l’estimation'}</small></article></section>
   <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Affectation d’un versement</span><h2>Quel mois de paie règle ces droits ?</h2></div>{!premium&&<span className="tag">Premium</span>}</div><div className="mr-form"><label>Mois du versement / bulletin<input type="month" value={paymentMonth} onChange={e=>setPaymentMonth(e.target.value)} disabled={!premium}/><small>Ex. novembre si les ISSR de septembre sont payées en novembre.</small></label><label>Montant affecté à {monthLabel(entitlementMonth)} (€)<input inputMode="decimal" value={received} onChange={e=>setReceived(e.target.value)} placeholder="Ex : 319,68" disabled={!premium}/></label><label>Fiche de paie associée<select value={documentId} onChange={e=>setDocumentId(e.target.value)} disabled={!premium}><option value="">Aucune fiche de paie</option>{docs.map(d=><option value={d.id} key={d.id}>{d.title||d.file_name}</option>)}</select></label><label className="mr-wide">Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex : rappel ISSR septembre sur paie de novembre" disabled={!premium}/></label><button className="btn btn-primary" onClick={save} disabled={!premium||busy}>{busy?'Enregistrement…':currentAllocation?'Mettre à jour l’affectation':'Ajouter ce versement'}</button></div>{message&&<p className="mr-message">{message}</p>}</section>
   {allocations.length>0&&<section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Historique</span><h2>Versements affectés à {monthLabel(entitlementMonth)}</h2></div><strong>{euro(receivedTotal)}</strong></div><div className="mr-list">{[...allocations].sort((a,b)=>a.payment_month.localeCompare(b.payment_month)).map(p=><article key={p.id}><div><strong>{monthLabel(p.payment_month)}</strong><span>{euro(Number(p.received_amount))}</span><small>{p.payment_month.slice(0,7)===entitlementMonth?'Versé le même mois':'Versement décalé'}{p.note?` · ${p.note}`:''}</small></div><button className="btn btn-danger" onClick={()=>remove(p)} disabled={!premium||busy}>Supprimer</button></article>)}</div></section>}
   {difference!==null&&difference< -0.01&&<section className="dashboard-panel premium-locked-panel"><span className="eyebrow">À vérifier</span><h2>{euro(Math.abs(difference))} restent à rapprocher</h2><p>Après prise en compte des versements affectés, ce montant des droits de {monthLabel(entitlementMonth)} n’est pas encore retrouvé. Il peut encore être payé sur un bulletin ultérieur : ajoutez ce versement lorsqu’il apparaît avant de préparer une demande de régularisation.</p></section>}
   {difference!==null&&Math.abs(difference)<0.01&&<section className="dashboard-panel report-panel"><span className="eyebrow">Rapprochement terminé</span><h2>Droits de {monthLabel(entitlementMonth)} retrouvés</h2><p>Les sommes affectées correspondent à l’estimation enregistrée dans Mon Remplacement.</p></section>}
  </>}
 </main>
}
