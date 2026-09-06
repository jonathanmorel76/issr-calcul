'use client'

import { useState } from 'react'

type Props={origin:string;destination:string;value:string;onChange:(value:string)=>void}

async function geocode(address:string):Promise<[number,number]>{
 const r=await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`)
 if(!r.ok)throw new Error('Impossible de localiser cette adresse.')
 const j=await r.json()
 if(!j.features?.length)throw new Error(`Adresse introuvable : ${address}`)
 return [j.features[0].geometry.coordinates[0],j.features[0].geometry.coordinates[1]]
}
async function routeKm(a:[number,number],b:[number,number]){
 const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=false&alternatives=false`)
 if(!r.ok)throw new Error('Le calcul routier est momentanément indisponible.')
 const j=await r.json()
 if(j.code!=='Ok'||!j.routes?.length)throw new Error('Aucun itinéraire routier n’a été trouvé.')
 return Math.round(j.routes[0].distance/100)/10
}

export default function DistanceCalculator({origin,destination,value,onChange}:Props){
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 async function calculate(){
  if(!origin.trim()){setMessage('Renseignez votre adresse de départ habituelle.');return}
  if(!destination.trim()){setMessage('Renseignez l’adresse de l’établissement.');return}
  setBusy(true);setMessage('')
  try{
   const [a,b]=await Promise.all([geocode(origin.trim()),geocode(destination.trim())])
   const km=await routeKm(a,b)
   onChange(String(km))
   setMessage(`${km.toLocaleString('fr-FR')} km calculés par itinéraire routier. Vous pouvez corriger cette valeur manuellement.`)
  }catch(e:any){setMessage(e.message||'Impossible de calculer la distance.')}finally{setBusy(false)}
 }
 return <div className="distance-calculator">
  <div className="distance-field"><label>Distance de référence (km)<input type="number" min="0" step="0.1" value={value} onChange={e=>onChange(e.target.value)} placeholder="Calcul automatique ou saisie manuelle"/></label><button type="button" className="btn btn-secondary" onClick={calculate} disabled={busy}>{busy?'Calcul du trajet…':'Calculer la distance'}</button></div>
  <small className={message?'distance-feedback visible':'distance-feedback'}>{message||'Le trajet routier est calculé entre votre adresse habituelle et cet établissement.'}</small>
 </div>
}