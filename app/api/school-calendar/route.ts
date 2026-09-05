import { NextRequest, NextResponse } from 'next/server'

const SOURCES: Record<string,string> = {
  A: 'https://fr.ftp.opendatasoft.com/openscol/fr-en-calendrier-scolaire/Zone-A.ics',
  B: 'https://fr.ftp.opendatasoft.com/openscol/fr-en-calendrier-scolaire/Zone-B.ics',
  C: 'https://fr.ftp.opendatasoft.com/openscol/fr-en-calendrier-scolaire/Zone-C.ics',
}

function toIso(value:string){
  const raw=value.trim().slice(0,8)
  if(!/^\d{8}$/.test(raw)) return null
  return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`
}

function datesBetween(start:string,endExclusive:string){
  const out:string[]=[]
  const d=new Date(start+'T12:00:00'), stop=new Date(endExclusive+'T12:00:00')
  while(d<stop){out.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
  return out
}

export async function GET(req:NextRequest){
  const zone=(req.nextUrl.searchParams.get('zone')||'').toUpperCase()
  const start=req.nextUrl.searchParams.get('start')||''
  const end=req.nextUrl.searchParams.get('end')||''
  if(!SOURCES[zone]||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)){
    return NextResponse.json({error:'Paramètres invalides'},{status:400})
  }
  const res=await fetch(SOURCES[zone],{next:{revalidate:86400}})
  if(!res.ok) return NextResponse.json({error:'Calendrier scolaire indisponible'},{status:502})
  const text=(await res.text()).replace(/\r?\n[ \t]/g,'')
  const events=text.split('BEGIN:VEVENT').slice(1)
  const blocked=new Set<string>()
  const periods:{summary:string;start:string;end:string}[]=[]
  for(const event of events){
    const ds=event.match(/DTSTART(?:;[^:]*)?:(\d{8})/i)?.[1]
    const de=event.match(/DTEND(?:;[^:]*)?:(\d{8})/i)?.[1]
    const summary=(event.match(/SUMMARY:(.+)/i)?.[1]||'Vacances scolaires').trim()
    if(!ds||!de) continue
    const s=toIso(ds), e=toIso(de)
    if(!s||!e||e<start||s>end) continue
    periods.push({summary,start:s,end:e})
    for(const date of datesBetween(s,e)) if(date>=start&&date<=end) blocked.add(date)
  }
  return NextResponse.json({zone,source:SOURCES[zone],blocked_dates:[...blocked].sort(),periods})
}
