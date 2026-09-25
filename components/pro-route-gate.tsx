'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export default function ProRouteGate({children}:{children:ReactNode}){
 const router=useRouter()
 const [allowed,setAllowed]=useState<boolean|null>(null)
 useEffect(()=>{
  const sync=()=>{
   let premium=false
   try{premium=window.localStorage.getItem('mr-beta-product-mode')==='premium'}catch{}
   setAllowed(premium)
   if(!premium)router.replace('/dashboard?offer=pro',{scroll:false})
  }
  sync()
  window.addEventListener('mr-beta-product-mode',sync)
  window.addEventListener('storage',sync)
  return()=>{window.removeEventListener('mr-beta-product-mode',sync);window.removeEventListener('storage',sync)}
 },[router])
 if(allowed!==true)return <main className="dashboard-main"><div className="dashboard-panel route-transition" role="status">Retour au tableau de bord…</div></main>
 return children
}
