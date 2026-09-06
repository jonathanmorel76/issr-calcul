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

function haversineKm(lat1:number, lon1:number, lat2:number, lon2:number){
  const r=6371
  const toRad=(v:number)=>v*Math.PI/180
  const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1)
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2*r*Math.asin(Math.sqrt(a))
}

export async function GET(req:NextRequest){
  const {searchParams}=new URL(req.url)
  const q=(searchParams.get('q')??'').trim()
  const lat=Number(searchParams.get('lat'))
  const lon=Number(searchParams.get('lon'))
  if(q.length<2)return NextResponse.json({results:[]})

  const escaped=q.replaceAll('"','\\"')
  const where=`search(nom_etablissement, "${escaped}") OR search(nom_commune, "${escaped}") OR search(adresse_1, "${escaped}")`
  const params=new URLSearchParams({
    select:'identifiant_de_l_etablissement,nom_etablissement,type_etablissement,statut_public_prive,adresse_1,adresse_2,adresse_3,code_postal,nom_commune,latitude,longitude,libelle_nature',
    where,
    limit:'30'
  })
  const url=`https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?${params}`
  try{
    const res=await fetch(url,{next:{revalidate:3600}})
    if(!res.ok)throw new Error(`Education API ${res.status}`)
    const json=await res.json() as {results?:RecordItem[]}
    const hasGeo=Number.isFinite(lat)&&Number.isFinite(lon)
    const results=(json.results??[]).map((r)=>{
      const rLat=Number(r.latitude),rLon=Number(r.longitude)
      const distanceKm=hasGeo&&Number.isFinite(rLat)&&Number.isFinite(rLon)?haversineKm(lat,lon,rLat,rLon):null
      const address=[r.adresse_1,r.adresse_2,r.adresse_3].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()
      const fullAddress=[address,[r.code_postal,r.nom_commune].filter(Boolean).join(' ')].filter(Boolean).join(', ')
      return {
        id:r.identifiant_de_l_etablissement??`${r.nom_etablissement}-${r.nom_commune}`,
        name:r.nom_etablissement??'Établissement',
        type:r.type_etablissement??r.libelle_nature??'',
        status:r.statut_public_prive??'',
        address:fullAddress,
        city:r.nom_commune??'',
        postalCode:r.code_postal??'',
        latitude:Number.isFinite(rLat)?rLat:null,
        longitude:Number.isFinite(rLon)?rLon:null,
        distanceKm
      }
    }).sort((a,b)=>{
      if(a.distanceKm==null&&b.distanceKm==null)return a.name.localeCompare(b.name,'fr')
      if(a.distanceKm==null)return 1
      if(b.distanceKm==null)return -1
      return a.distanceKm-b.distanceKm
    }).slice(0,8)
    return NextResponse.json({results})
  }catch(error){
    console.error(error)
    return NextResponse.json({results:[]},{status:200})
  }
}
