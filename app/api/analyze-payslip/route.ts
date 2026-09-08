import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MONTHS:Record<string,string>={
 janvier:'01',fevrier:'02',février:'02',mars:'03',avril:'04',mai:'05',juin:'06',juillet:'07',aout:'08',août:'08',septembre:'09',octobre:'10',novembre:'11',decembre:'12',décembre:'12'
}

function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function parseAmount(raw:string){
 const clean=raw.replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.')
 const value=Number(clean)
 return Number.isFinite(value)?value:null
}
function inferMonth(text:string){
 const normalized=normalize(text)
 const yearMatches=[...normalized.matchAll(/\b(20\d{2})\b/g)].map(m=>m[1])
 const year=yearMatches.at(-1)??String(new Date().getFullYear())
 for(const [name,num] of Object.entries(MONTHS)){
  if(normalized.includes(normalize(name)))return `${year}-${num}`
 }
 const numeric=normalized.match(/\b(0[1-9]|1[0-2])[\/\-.](20\d{2})\b/)
 return numeric?`${numeric[2]}-${numeric[1]}`:null
}

function analyzeLines(lines:string[]){
 const relevant=lines.filter(line=>/issr|sujetions speciales de remplacement|sujétions spéciales de remplacement|indemnit[eé].{0,24}remplacement/i.test(line))
 const suggestions=relevant.flatMap(line=>{
  const amounts=[...line.matchAll(/(?:\d{1,3}(?:[ .]\d{3})*|\d+)[,.]\d{2}/g)].map(m=>({raw:m[0],value:parseAmount(m[0])})).filter(x=>x.value!==null) as {raw:string;value:number}[]
  if(!amounts.length)return []
  const candidate=amounts.at(-1)!
  return [{label:line.trim().slice(0,180),amount:candidate.value}]
 })
 const deduped=suggestions.filter((s,i,a)=>a.findIndex(x=>x.label===s.label&&Math.abs(x.amount-s.amount)<0.001)===i)
 const total=deduped.reduce((sum,s)=>sum+s.amount,0)
 const confidence=deduped.length>=2?'high':deduped.length===1?'medium':'low'
 return {suggestions:deduped,total,confidence}
}

export async function POST(request:NextRequest){
 let loadingTask:ReturnType<(typeof import('pdfjs-dist/legacy/build/pdf.mjs'))['getDocument']>|null=null
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
  if(doc.mime_type!=='application/pdf')return NextResponse.json({error:'La lecture automatique V1 prend actuellement en charge les fiches de paie PDF texte.'},{status:415})
  const {data:file,error:fileError}=await supabase.storage.from('issr-documents').download(doc.storage_path)
  if(fileError||!file)return NextResponse.json({error:'Impossible de lire le fichier.'},{status:400})
  const bytes=new Uint8Array(await file.arrayBuffer())
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs')
  loadingTask=pdfjs.getDocument({data:bytes})
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
    const row=groups.get(y)??[]
    row.push({x,text:item.str.trim()});groups.set(y,row)
   }
   const pageLines=[...groups.entries()].sort((a,b)=>b[0]-a[0]).map(([,row])=>row.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean)
   lines.push(...pageLines)
  }
  const text=lines.join('\n')
  if(text.replace(/\s/g,'').length<80)return NextResponse.json({error:'Ce PDF semble être un scan ou ne contient pas assez de texte exploitable. La lecture OCR n’est pas encore activée.'},{status:422})
  const analysis=analyzeLines(lines)
  return NextResponse.json({
   document:{id:doc.id,title:doc.title,fileName:doc.file_name},
   inferredPaymentMonth:inferMonth(`${doc.title??''} ${doc.file_name??''}\n${text.slice(0,4000)}`),
   ...analysis,
   disclaimer:'Résultat indicatif : vérifiez les lignes proposées avant de les affecter à vos droits ISSR.'
  })
 }catch(error:any){
  console.error('analyze-payslip',error)
  return NextResponse.json({error:'Analyse impossible pour ce document.'},{status:500})
 }finally{
  try{await loadingTask?.destroy()}catch{}
 }
}
