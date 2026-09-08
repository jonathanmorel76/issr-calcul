'use client'

import { useMemo, useState } from 'react'

type Entry={travel_date:string;destination:string;distance_km:number;total_amount:number;rate_code:string|null}
type Payment={payment_month:string;entitlement_month:string;received_amount:number;note:string|null;source_document_id:string|null}
type Doc={id:string;title:string|null;file_name:string;created_at:string}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}
function frDate(value:string){return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR')}

export default function RegularizationDossierView({month,entries,payments,documents}:{month:string;entries:Entry[];payments:Payment[];documents:Doc[]}){
 const [copied,setCopied]=useState(false)
 const expected=useMemo(()=>entries.reduce((sum,e)=>sum+Number(e.total_amount||0),0),[entries])
 const received=useMemo(()=>payments.reduce((sum,p)=>sum+Number(p.received_amount||0),0),[payments])
 const outstanding=Math.max(0,expected-received)
 const linkedDocuments=useMemo(()=>{
  const ids=new Set(payments.map(p=>p.source_document_id).filter(Boolean) as string[])
  return documents.filter(doc=>ids.has(doc.id))
 },[documents,payments])
 const dossierText=useMemo(()=>{
  const dayLines=entries.length?entries.map(e=>`- ${frDate(e.travel_date)} · ${e.destination} · ${Number(e.distance_km).toLocaleString('fr-FR',{maximumFractionDigits:1})} km · ${euro(Number(e.total_amount))}${e.rate_code?` · ${e.rate_code}`:''}`).join('\n'):'- Aucune journée détaillée disponible'
  const paymentLines=payments.length?payments.map(p=>`- Bulletin / versement ${monthLabel(p.payment_month.slice(0,7))} : ${euro(Number(p.received_amount))}${p.note?` · ${p.note}`:''}`).join('\n'):'- Aucun versement rapproché'
  const docLines=linkedDocuments.length?linkedDocuments.map(d=>`- ${d.title||d.file_name}`).join('\n'):'- Aucun bulletin de paie lié pour le moment'
  return `Objet : Demande de vérification et de régularisation des ISSR – ${monthLabel(month)}\n\nBonjour,\n\nJe sollicite une vérification du versement de mes indemnités de sujétions spéciales de remplacement (ISSR) pour ${monthLabel(month)}.\n\nDroits estimés à partir de mes remplacements enregistrés : ${euro(expected)}.\nVersements déjà identifiés et rapprochés : ${euro(received)}.\nMontant restant à vérifier / régulariser : ${euro(outstanding)}.\n\nDétail des journées concernées :\n${dayLines}\n\nVersements déjà rapprochés :\n${paymentLines}\n\nPièces disponibles :\n${docLines}\n\nJe vous remercie de bien vouloir contrôler ces éléments et, si nécessaire, procéder à la régularisation du montant restant. Je reste disponible pour transmettre tout justificatif complémentaire.\n\nCordialement,`
 },[month,entries,payments,linkedDocuments,expected,received,outstanding])
 async function copy(){try{await navigator.clipboard.writeText(dossierText);setCopied(true)}catch{setCopied(false)}}
 return <main className="dashboard-main reports-page payments-page">
  <section className="report-period"><div><span className="eyebrow">Dossier de régularisation</span><h1>{monthLabel(month)}</h1></div><a className="btn btn-export" href={`/dashboard/versements?month=${month}`}>Retour aux versements</a></section>
  <section className="report-kpis payment-kpis"><article><span>Droits estimés</span><strong>{euro(expected)}</strong><small>{entries.length} journée(s)</small></article><article><span>Déjà rapproché</span><strong>{euro(received)}</strong><small>{payments.length} versement(s)</small></article><article><span>À vérifier / régulariser</span><strong>{euro(outstanding)}</strong><small>{outstanding>0?'Dossier à contrôler avant envoi':'Aucun solde restant'}</small></article></section>
  <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Synthèse prête à envoyer</span><h2>Demande de vérification / régularisation</h2></div><button className="btn btn-primary" onClick={copy}>{copied?'Dossier copié ✓':'Copier le dossier'}</button></div><textarea readOnly rows={18} value={dossierText} style={{width:'100%',resize:'vertical'}}/></section>
  <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Justificatifs</span><h2>Éléments repris dans le dossier</h2></div></div><div className="mr-list"><article><div><strong>Journées de remplacement</strong><span>{entries.length} journée(s)</span><small>{entries.length?'Toutes les journées du mois sont listées dans la demande.':'Aucune journée trouvée pour ce mois.'}</small></div></article><article><div><strong>Versements déjà identifiés</strong><span>{payments.length}</span><small>{payments.length?payments.map(p=>monthLabel(p.payment_month.slice(0,7))).join(' · '):'Aucun versement rapproché'}</small></div></article><article><div><strong>Fiches de paie liées</strong><span>{linkedDocuments.length}</span><small>{linkedDocuments.length?linkedDocuments.map(d=>d.title||d.file_name).join(' · '):'Aucun bulletin lié aux versements de ce mois'}</small></div></article></div></section>
  <section className="dashboard-panel premium-locked-panel"><span className="eyebrow">Avant envoi</span><h2>Contrôle recommandé</h2><p>Le dossier est généré à partir des données enregistrées dans Mon Remplacement. Vérifiez les journées, les montants et les bulletins associés avant de transmettre la demande à votre gestionnaire.</p></section>
 </main>
}
