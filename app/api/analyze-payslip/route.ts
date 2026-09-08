import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const MONTHS:Record<string,string>={
 janvier:'01',fevrier:'02',février:'02',mars:'03',avril:'04',mai:'05',juin:'06',juillet:'07',aout:'08',août:'08',septembre:'09',octobre:'10',novembre:'11',decembre:'12',décembre:'12'
}
const ALLOWED_IMAGES=new Set(['image/jpeg','image/png','image/webp'])

type PeriodSuggestion={entitlementMonth:string|null;total:number;lineCount:number}
type PeriodComparison=PeriodSuggestion&{
 expected:number|null
 alreadyAllocated:number
 outstanding:number|null
 gap:number|null
 matchPercent:number|null
 status:'exact'|'close'|'partial'|'excess'|'no-rights'|'unknown'
 label:string
}

function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function parseAmount(raw:string){
 const clean=raw.replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.')
 const value=Number(clean)
 return Number.isFinite(value)?value:null
}
function inferMonth(text:string,fallbackYear?:string){
 const normalized=normalize(text)
 const numeric=normalized.match(/\b(0[1-9]|1[0-2])[\/\-.](20\d{2})\b/)
 if(numeric)return `${numeric[2]}-${numeric[1]}`
 const yearMatches=[...normalized.matchAll(/\b(20\d{2})\b/g)].map(m=>m[1])
 const year=yearMatches.at(-1)??fallbackYear??String(new Date().getFullYear())
 for(const [name,num] of Object.entries(MONTHS)){
  if(normalized.includes(normalize(name)))return `${year}-${num}`
 }
 return null
}
function relevantLine(line:string){return /issr|sujetions speciales de remplacement|sujétions spéciales de remplacement|indemnit[eé].{0,32}remplacement|remplacement.{0,32}indemnit[eé]/i.test(line)}
function euro(value:number){return value.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function monthLabel(value:string){return new Date(`${value}-01T12:00:00`).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

function analyzeLines(lines:string[],fallbackYear?:string){
 const relevant=lines.filter(relevantLine)
 const suggestions=relevant.flatMap(line=>{
  const amounts=[...line.matchAll(/(?:\d{1,3}(?:[ .]\d{3})*|\d+)[,.]\d{2}/g)].map(m=>({raw:m[0],value:parseAmount(m[0])})).filter(x=>x.value!==null) as {raw:string;value:number}[]
  if(!amounts.length)return []
  const candidate=amounts.at(-1)!
  return [{label:line.trim().slice(0,220),amount:candidate.value,entitlementMonth:inferMonth(line,fallbackYear)}]
 })
 const deduped=suggestions.filter((s,i,a)=>a.findIndex(x=>x.label===s.label&&Math.abs(x.amount-s.amount)<0.001)===i)
 const total=deduped.reduce((sum,s)=>sum+s.amount,0)
 const confidence=deduped.length>=2?'high':deduped.length===1?'medium':'low'
 const grouped=new Map<string,PeriodSuggestion>()
 for(const item of deduped){
  const key=item.entitlementMonth??'unknown'
  const current=grouped.get(key)??{entitlementMonth:item.entitlementMonth,total:0,lineCount:0}
  current.total+=item.amount;current.lineCount+=1;grouped.set(key,current)
 }
 return {suggestions:deduped,total,confidence,periodSuggestions:[...grouped.values()]}
}

function comparePeriods(periods:PeriodSuggestion[],entries:{travel_date:string;total_amount:number}[],payments:{entitlement_month:string;received_amount:number}[]){
 const expectedByMonth=new Map<string,number>()
 for(const entry of entries){
  const month=entry.travel_date.slice(0,7)
  expectedByMonth.set(month,(expectedByMonth.get(month)??0)+Number(entry.total_amount||0))
 }
 const allocatedByMonth=new Map<string,number>()
 for(const payment of payments){
  const month=payment.entitlement_month.slice(0,7)
  allocatedByMonth.set(month,(allocatedByMonth.get(month)??0)+Number(payment.received_amount||0))
 }
 return periods.map<PeriodComparison>(period=>{
  if(!period.entitlementMonth)return {...period,expected:null,alreadyAllocated:0,outstanding:null,gap:null,matchPercent:null,status:'unknown',label:'Période non identifiée : vérification manuelle nécessaire.'}
  const month=period.entitlementMonth
  const expected=expectedByMonth.get(month)??0
  const alreadyAllocated=allocatedByMonth.get(month)??0
  const outstanding=Math.max(0,expected-alreadyAllocated)
  if(expected<=0)return {...period,expected,alreadyAllocated,outstanding,gap:period.total,matchPercent:null,status:'no-rights',label:`Aucun droit ISSR enregistré pour ${monthLabel(month)}.`}
  const gap=period.total-outstanding
  const tolerance=Math.max(1,Math.min(5,outstanding*0.02))
  const matchPercent=outstanding>0?Math.round((period.total/outstanding)*1000)/10:null
  let status:PeriodComparison['status']='partial'
  let label=''
  if(Math.abs(gap)<0.01){status='exact';label=`Correspondance exacte avec les ${euro(outstanding)} restant à recevoir.`}
  else if(Math.abs(gap)<=tolerance){status='close';label=`Correspondance très probable : écart de ${euro(Math.abs(gap))}.`}
  else if(gap<0){status='partial';label=`Versement partiel probable : ${euro(Math.abs(gap))} resteraient encore à rapprocher.`}
  else{status='excess';label=`Montant supérieur de ${euro(gap)} aux droits restant à rapprocher.`}
  return {...period,expected,alreadyAllocated,outstanding,gap,matchPercent,status,label}
 })
}

async function ocrImage(input:Uint8Array|Buffer){
 const {createWorker}=await import('tesseract.js')
 const worker=await createWorker('fra')
 try{
  const result=await worker.recognize(Buffer.from(input))
  const text=result.data.text??''
  return text.split(/\r?\n/).map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean)
 }finally{await worker.terminate()}
}

async function extractPdfText(bytes:Uint8Array){
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs')
 const loadingTask=pdfjs.getDocument({data:bytes})
 try{
  const pdf=await loadingTask.promise
  const lines:string[]=[]
  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
   const page=await pdf.getPage(pageNo)
   const content=await page.getTextContent()
   const items=(content.items as any[]).filter(item=>typeof item?.str==='string'&&item.str.trim())
   const groups=new Map<number,{x:number;text:string}[]>()
   for(const item of items){
    const y=Math.round(Number(item.transform?.[5]??0)/2)*2
    const x=Number(item.transform?.[4]??0)
    const row=groups.get(y)??[];row.push({x,text:item.str.trim()});groups.set(y,row)
   }
   lines.push(...[...groups.entries()].sort((a,b)=>b[0]-a[0]).map(([,row])=>row.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean))
  }
  return {lines,pdf,loadingTask}
 }catch(error){try{await loadingTask.destroy()}catch{};throw error}
}

async function ocrPdf(bytes:Uint8Array,pdf:any){
 const {createCanvas}=await import('@napi-rs/canvas')
 const {createWorker}=await import('tesseract.js')
 const worker=await createWorker('fra')
 const lines:string[]=[]
 try{
  const pages=Math.min(pdf.numPages,3)
  for(let pageNo=1;pageNo<=pages;pageNo++){
   const page=await pdf.getPage(pageNo)
   const viewport=page.getViewport({scale:1.7})
   const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height))
   const context=canvas.getContext('2d')
   await page.render({canvasContext:context as any,viewport} as any).promise
   const png=canvas.toBuffer('image/png')
   const result=await worker.recognize(png)
   lines.push(...(result.data.text??'').split(/\r?\n/).map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean))
  }
  return lines
 }finally{await worker.terminate()}
}

export async function POST(request:NextRequest){
 let pdfLoadingTask:any=null
 try{
  const {documentId}=await request.json() as {documentId?:string}
  if(!documentId)return NextResponse.json({error:'Document manquant.'},{status:400})
  const supabase=await createClient()
  const {data:claims}=await supabase.auth.getClaims()
  const userId=claims?.claims?.sub as string|undefined
  if(!userId)return NextResponse.json({error:'Non authentifié.'},{status:401})
  const {data:doc,error:docError}=await supabase.from('issr_documents').select('id,title,file_name,storage_path,mime_type,category').eq('id',documentId).maybeSingle()
  if(docError||!doc)return NextResponse.json({error:'Document introuvable.'},{status:404})
  if(doc.category!=='fiche_paie')return NextResponse.json({error:'Ce document n’est pas classé comme fiche de paie.'},{status:400})
  if(doc.mime_type!=='application/pdf'&&!ALLOWED_IMAGES.has(doc.mime_type))return NextResponse.json({error:'Format non pris en charge pour l’analyse.'},{status:415})
  const {data:file,error:fileError}=await supabase.storage.from('issr-documents').download(doc.storage_path)
  if(fileError||!file)return NextResponse.json({error:'Impossible de lire le fichier.'},{status:400})
  const bytes=new Uint8Array(await file.arrayBuffer())
  let lines:string[]=[]
  let method:'pdf-text'|'ocr-image'|'ocr-pdf'='pdf-text'
  if(ALLOWED_IMAGES.has(doc.mime_type)){
   method='ocr-image';lines=await ocrImage(bytes)
  }else{
   const extracted=await extractPdfText(bytes)
   lines=extracted.lines
   pdfLoadingTask=extracted.loadingTask
   if(lines.join('').replace(/\s/g,'').length<80){method='ocr-pdf';lines=await ocrPdf(bytes,extracted.pdf)}
  }
  const text=lines.join('\n')
  if(text.replace(/\s/g,'').length<40)return NextResponse.json({error:'Le document n’a pas pu être lu de façon suffisamment fiable.'},{status:422})
  const inferredPaymentMonth=inferMonth(`${doc.title??''} ${doc.file_name??''}\n${text.slice(0,5000)}`)
  const fallbackYear=inferredPaymentMonth?.slice(0,4)
  const analysis=analyzeLines(lines,fallbackYear)
  const [{data:entries,error:entriesError},{data:payments,error:paymentsError}]=await Promise.all([
   supabase.from('issr_entries').select('travel_date,total_amount').eq('user_id',userId),
   supabase.from('issr_payments').select('entitlement_month,received_amount').eq('user_id',userId),
  ])
  if(entriesError||paymentsError)return NextResponse.json({error:'Impossible de comparer la fiche avec vos droits enregistrés.'},{status:500})
  const comparisons=comparePeriods(analysis.periodSuggestions,(entries??[]) as {travel_date:string;total_amount:number}[],(payments??[]) as {entitlement_month:string;received_amount:number}[])
  const comparisonSummary=comparisons.map(item=>item.entitlementMonth?`${monthLabel(item.entitlementMonth)} : ${item.label}`:item.label).join(' ')
  return NextResponse.json({
   document:{id:doc.id,title:doc.title,fileName:doc.file_name},
   method,
   inferredPaymentMonth,
   ...analysis,
   periodSuggestions:comparisons,
   comparisonSummary,
   disclaimer:`Résultat indicatif : vérifiez toujours les lignes et périodes proposées avant validation. ${comparisonSummary}`
  })
 }catch(error:any){
  console.error('analyze-payslip',error)
  return NextResponse.json({error:'Analyse impossible pour ce document.'},{status:500})
 }finally{
  try{await pdfLoadingTask?.destroy?.()}catch{}
 }
}
