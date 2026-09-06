import { NextRequest, NextResponse } from 'next/server'

type RecordItem = {
  identifiant_de_l_etablissement?: string
  nom_etablissement?: string
  type_etablissement?: string
  statut_public_prive?: string
  adresse_1?: string
  adresse_2?: string
  adresse_3?: string
  code_postal?: string
  nom_commune?: string
  latitude?: number | string
  longitude?: number | string
  libelle_nature?: string
}

type ResultItem={
  id:string;name:string;type:string;status:string;address:string;city:string;postalCode:string
  latitude:number|null;longitude:number|null;distanceKm:number|null;matchScore:number
}

function haversineKm(lat1:number,lon1:number,lat2:number,lon2:number){
  const r=6371,toRad=(v:number)=>v*Math.PI/180
  const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1)
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2*r*Math.asin(Math.sqrt(a))
}

function normalize(value:string){
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/[^a-z0-9]+/g,' ').trim()
}

const GENERIC=new Set(['ecole','ecoles','maternelle','elementaire','primaire','college','lycee','etablissement','groupe','scolaire','public','prive'])
function meaningfulTokens(q:string){
  const tokens=normalize(q).split(' ').filter(t=>t.length>=2)
  const specific=tokens.filter(t=>!GENERIC.has(t))
  return specific.length?specific:tokens
}
function escapeSearch(value:string){return value.replaceAll('"','\\"')}
function textScore(q:string,r:RecordItem){
  const needle=normalize(q),name=normalize(r.nom_etablissement??''),city=normalize(r.nom_commune??''),address=normalize(r.adresse_1??'')
  const tokens=meaningfulTokens(q)
  let score=0
  if(name===needle)score+=120
  if(name.includes(needle))score+=90
  for(const token of tokens){
    if(name.includes(token))score+=24
    else if(city.includes(token))score+=10
    else if(address.includes(token))score+=4
  }
  return score
}

async function fetchRecords(where:string,limit=100){
  const params=new URLSearchParams({
    select:'identifiant_de_l_etablissement,nom_etablissement,type_etablissement,statut_public_prive,adresse_1,adresse_2,adresse_3,code_postal,nom_commune,latitude,longitude,libelle_nature',
    where,limit:String(limit)
  })
  const url=`https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?${params}`
  const res=await fetch(url,{next:{revalidate:1800}})
  if(!res.ok)throw new Error(`Education API ${res.status}`)
  const json=await res.json() as {results?:RecordItem[]}
  return json.results??[]
}

export async function GET(req:NextRequest){
  const {searchParams}=new URL(req.url)
  const q=(searchParams.get('q')??'').trim()
  const lat=Number(searchParams.get('lat')),lon=Number(searchParams.get('lon'))
  if(q.length<2)return NextResponse.json({results:[]})
  const hasGeo=Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180
  const tokens=meaningfulTokens(q)
  const nameTokenWhere=tokens.map(t=>`search(nom_etablissement, "${escapeSearch(t)}")`).join(' AND ')
  const broadWhere=`search(nom_etablissement, "${escapeSearch(q)}") OR search(nom_commune, "${escapeSearch(q)}") OR search(adresse_1, "${escapeSearch(q)}")`
  const queries:string[]=[]

  if(hasGeo){
    // First search a wide area around the device. This avoids a common school name elsewhere in France
    // consuming the API result limit before the nearby establishment is returned.
    const latRadius=.9,lonRadius=Math.min(1.6,.9/Math.max(.35,Math.cos(lat*Math.PI/180)))
    const geoBox=`latitude >= ${Math.max(-90,lat-latRadius)} AND latitude <= ${Math.min(90,lat+latRadius)} AND longitude >= ${Math.max(-180,lon-lonRadius)} AND longitude <= ${Math.min(180,lon+lonRadius)}`
    if(nameTokenWhere)queries.push(`(${nameTokenWhere}) AND ${geoBox}`)
    queries.push(`(${broadWhere}) AND ${geoBox}`)
  }
  if(nameTokenWhere)queries.push(nameTokenWhere)
  queries.push(broadWhere)
  // Last-resort recall query on the most distinctive token catches spelling/word-order differences.
  const longest=[...tokens].sort((a,b)=>b.length-a.length)[0]
  if(longest)queries.push(`search(nom_etablissement, "${escapeSearch(longest)}")`)

  try{
    const settled=await Promise.allSettled([...new Set(queries)].map(where=>fetchRecords(where,100)))
    const merged=new Map<string,RecordItem>()
    for(const response of settled){
      if(response.status!=='fulfilled')continue
      for(const r of response.value){
        const id=r.identifiant_de_l_etablissement??`${r.nom_etablissement}-${r.nom_commune}-${r.adresse_1}`
        if(!merged.has(id))merged.set(id,r)
      }
    }

    const results:Array<ResultItem>=Array.from(merged.values()).map(r=>{
      const rLat=Number(r.latitude),rLon=Number(r.longitude)
      const distanceKm=hasGeo&&Number.isFinite(rLat)&&Number.isFinite(rLon)?haversineKm(lat,lon,rLat,rLon):null
      const address=[r.adresse_1,r.adresse_2,r.adresse_3].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()
      const fullAddress=[address,[r.code_postal,r.nom_commune].filter(Boolean).join(' ')].filter(Boolean).join(', ')
      return {
        id:r.identifiant_de_l_etablissement??`${r.nom_etablissement}-${r.nom_commune}`,
        name:r.nom_etablissement??'Établissement',type:r.type_etablissement??r.libelle_nature??'',status:r.statut_public_prive??'',
        address:fullAddress,city:r.nom_commune??'',postalCode:r.code_postal??'',
        latitude:Number.isFinite(rLat)?rLat:null,longitude:Number.isFinite(rLon)?rLon:null,distanceKm,matchScore:textScore(q,r)
      }
    }).filter(r=>r.matchScore>0)
      .sort((a,b)=>{
        // Strong textual matches first; within a similar match quality, nearby schools win.
        const scoreGap=b.matchScore-a.matchScore
        if(Math.abs(scoreGap)>=20)return scoreGap
        if(a.distanceKm!=null&&b.distanceKm!=null&&Math.abs(a.distanceKm-b.distanceKm)>1)return a.distanceKm-b.distanceKm
        if(a.distanceKm!=null&&b.distanceKm==null)return -1
        if(a.distanceKm==null&&b.distanceKm!=null)return 1
        return scoreGap||a.name.localeCompare(b.name,'fr')
      }).slice(0,12)

    return NextResponse.json({results,meta:{sourcesSucceeded:settled.filter(x=>x.status==='fulfilled').length,geolocated:hasGeo}})
  }catch(error){
    console.error(error)
    return NextResponse.json({results:[]},{status:200})
  }
}
