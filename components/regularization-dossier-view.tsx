'use client'

import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

type Entry={travel_date:string;destination:string;distance_km:number;total_amount:number;rate_code:string|null}
type Payment={payment_month:string;entitlement_month:string;received_amount:number;note:string|null;source_document_id:string|null}
type Doc={id:string;title:string|null;file_name:string;created_at:string}

function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function money(value:number){return `${value.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €`}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}
function frDate(value:string){return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR')}

export default function RegularizationDossierView({month,entries,payments,documents}:{month:string;entries:Entry[];payments:Payment[];documents:Doc[]}){
 const [copied,setCopied]=useState(false)
 const [pdfBusy,setPdfBusy]=useState(false)
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
 function exportPdf(){
  setPdfBusy(true)
  try{
   const doc=new jsPDF({unit:'mm',format:'a4'})
   const pageWidth=doc.internal.pageSize.getWidth()
   const pageHeight=doc.internal.pageSize.getHeight()
   const margin=16
   const usable=pageWidth-margin*2
   const ensureSpace=(needed:number,y:number)=>{if(y+needed>pageHeight-18){doc.addPage();return 18}return y}
   let y=18
   doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('Mon Remplacement',margin,y)
   y+=8;doc.setFontSize(14);doc.text('Dossier de régularisation ISSR',margin,y)
   y+=7;doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(`Période : ${monthLabel(month)}`,margin,y)
   doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`,pageWidth-margin,y,{align:'right'})
   y+=10
   autoTable(doc,{startY:y,head:[['Synthèse','Montant']],body:[['Droits estimés',money(expected)],['Déjà rapproché',money(received)],['Reste à vérifier / régulariser',money(outstanding)]],theme:'grid',styles:{font:'helvetica',fontSize:9,cellPadding:2.5},headStyles:{fontStyle:'bold'},margin:{left:margin,right:margin}})
   y=((doc as any).lastAutoTable?.finalY??y)+8
   y=ensureSpace(18,y);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Journées de remplacement concernées',margin,y);y+=4
   autoTable(doc,{startY:y,head:[['Date','Établissement','Distance','Barème','Montant']],body:entries.length?entries.map(e=>[frDate(e.travel_date),e.destination,`${Number(e.distance_km).toLocaleString('fr-FR',{maximumFractionDigits:1})} km`,e.rate_code||'—',money(Number(e.total_amount))]):[['—','Aucune journée disponible','—','—','—']],theme:'grid',styles:{font:'helvetica',fontSize:8,cellPadding:2},columnStyles:{1:{cellWidth:62}},margin:{left:margin,right:margin}})
   y=((doc as any).lastAutoTable?.finalY??y)+8
   y=ensureSpace(18,y);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Versements déjà rapprochés',margin,y);y+=4
   autoTable(doc,{startY:y,head:[['Mois de paie','Montant','Note']],body:payments.length?payments.map(p=>[monthLabel(p.payment_month.slice(0,7)),money(Number(p.received_amount)),p.note||'—']):[['—','0,00 €','Aucun versement rapproché']],theme:'grid',styles:{font:'helvetica',fontSize:8,cellPadding:2},columnStyles:{2:{cellWidth:80}},margin:{left:margin,right:margin}})
   y=((doc as any).lastAutoTable?.finalY??y)+8
   y=ensureSpace(20,y);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Pièces justificatives liées',margin,y);y+=6
   doc.setFont('helvetica','normal');doc.setFontSize(9)
   const docsText=linkedDocuments.length?linkedDocuments.map((d,i)=>`${i+1}. ${d.title||d.file_name}`).join('\n'):'Aucune fiche de paie liée à ce jour.'
   const docLines=doc.splitTextToSize(docsText,usable)
   doc.text(docLines,margin,y);y+=docLines.length*4.5+8
   y=ensureSpace(32,y);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Demande de vérification / régularisation',margin,y);y+=6
   doc.setFont('helvetica','normal');doc.setFontSize(9)
   const request=`Je sollicite une vérification du versement de mes indemnités de sujétions spéciales de remplacement (ISSR) pour ${monthLabel(month)}. Selon mon relevé, mes droits estimés s’élèvent à ${money(expected)}. Les versements déjà identifiés représentent ${money(received)}, laissant ${money(outstanding)} à vérifier ou régulariser. Je vous remercie de bien vouloir contrôler ces éléments et, si nécessaire, procéder à la régularisation correspondante.`
   const requestLines=doc.splitTextToSize(request,usable)
   for(const line of requestLines){y=ensureSpace(5,y);doc.text(line,margin,y);y+=4.5}
   y+=4;y=ensureSpace(14,y);doc.setFont('helvetica','italic');doc.setFontSize(8);const footer=doc.splitTextToSize('Document généré à partir des données enregistrées dans Mon Remplacement. Les montants, journées et justificatifs doivent être vérifiés avant transmission à l’administration.',usable);doc.text(footer,margin,y)
   const pages=doc.getNumberOfPages()
   for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(`Page ${page} / ${pages}`,pageWidth-margin,pageHeight-8,{align:'right'})}
   doc.save(`dossier-regularisation-ISSR-${month}.pdf`)
  }finally{setPdfBusy(false)}
 }
 return <main className="dashboard-main reports-page payments-page">
  <section className="report-period"><div><span className="eyebrow">Dossier de régularisation</span><h1>{monthLabel(month)}</h1></div><a className="btn btn-export" href={`/dashboard/versements?month=${month}`}>Retour aux versements</a></section>
  <section className="report-kpis payment-kpis"><article><span>Droits estimés</span><strong>{euro(expected)}</strong><small>{entries.length} journée(s)</small></article><article><span>Déjà rapproché</span><strong>{euro(received)}</strong><small>{payments.length} versement(s)</small></article><article><span>À vérifier / régulariser</span><strong>{euro(outstanding)}</strong><small>{outstanding>0?'Dossier à contrôler avant envoi':'Aucun solde restant'}</small></article></section>
  <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Synthèse prête à envoyer</span><h2>Demande de vérification / régularisation</h2></div><div className="document-actions"><button className="btn btn-export" onClick={exportPdf} disabled={pdfBusy}>{pdfBusy?'Génération…':'Exporter en PDF'}</button><button className="btn btn-primary" onClick={copy}>{copied?'Dossier copié ✓':'Copier le dossier'}</button></div></div><textarea readOnly rows={18} value={dossierText} style={{width:'100%',resize:'vertical'}}/></section>
  <section className="dashboard-panel report-panel"><div className="report-head"><div><span className="eyebrow">Justificatifs</span><h2>Éléments repris dans le dossier</h2></div></div><div className="mr-list"><article><div><strong>Journées de remplacement</strong><span>{entries.length} journée(s)</span><small>{entries.length?'Toutes les journées du mois sont listées dans la demande.':'Aucune journée trouvée pour ce mois.'}</small></div></article><article><div><strong>Versements déjà identifiés</strong><span>{payments.length}</span><small>{payments.length?payments.map(p=>monthLabel(p.payment_month.slice(0,7))).join(' · '):'Aucun versement rapproché'}</small></div></article><article><div><strong>Fiches de paie liées</strong><span>{linkedDocuments.length}</span><small>{linkedDocuments.length?linkedDocuments.map(d=>d.title||d.file_name).join(' · '):'Aucun bulletin lié aux versements de ce mois'}</small></div></article></div></section>
  <section className="dashboard-panel premium-locked-panel"><span className="eyebrow">Avant envoi</span><h2>Contrôle recommandé</h2><p>Le dossier est généré à partir des données enregistrées dans Mon Remplacement. Vérifiez les journées, les montants et les bulletins associés avant de transmettre la demande à votre gestionnaire.</p></section>
 </main>
}
