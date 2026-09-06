import { NextRequest, NextResponse } from 'next/server'

export async function GET(req:NextRequest){
  const {searchParams}=new URL(req.url)
  const q=(searchParams.get('q')??'').trim()
  const lat=searchParams.get('lat')
  const lon=searchParams.get('lon')
  if(q.length<3)return NextResponse.json({results:[]})
  const params=new URLSearchParams({q,limit:'6',autocomplete:'1'})
  if(lat&&lon){params.set('lat',lat);params.set('lon',lon)}
  try{
    const res=await fetch(`https://api-adresse.data.gouv.fr/search/?${params}`,{next:{revalidate:300}})
    if(!res.ok)throw new Error(`BAN ${res.status}`)
    const json=await res.json() as {features?:Array<{properties?:Record<string,unknown>;geometry?:{coordinates?:[number,number]}}>} 
    const results=(json.features??[]).map((f,index)=>{
      const p=f.properties??{}
      const coords=f.geometry?.coordinates
      return {
        id:String(p.id??index),
        label:String(p.label??''),
        name:String(p.name??''),
        city:String(p.city??''),
        postcode:String(p.postcode??''),
        context:String(p.context??''),
        latitude:coords?.[1]??null,
        longitude:coords?.[0]??null
      }
    })
    return NextResponse.json({results})
  }catch(error){
    console.error(error)
    return NextResponse.json({results:[]})
  }
}
