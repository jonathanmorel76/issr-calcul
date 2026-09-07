'use client'

import { useEffect, useState } from 'react'

export type BetaProductMode='free'|'premium'

export default function useBetaProductMode(){
 const [mode,setMode]=useState<BetaProductMode>('free')
 useEffect(()=>{
  const read=()=>{try{setMode(window.localStorage.getItem('mr-beta-product-mode')==='premium'?'premium':'free')}catch{setMode('free')}}
  read()
  const onMode=(event:Event)=>{
   const detail=(event as CustomEvent<{mode?:BetaProductMode}>).detail
   if(detail?.mode)setMode(detail.mode)
   else read()
  }
  window.addEventListener('mr-beta-product-mode',onMode)
  window.addEventListener('storage',read)
  return()=>{window.removeEventListener('mr-beta-product-mode',onMode);window.removeEventListener('storage',read)}
 },[])
 return mode
}
