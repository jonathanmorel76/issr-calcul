'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const VIEW_LABELS:Record<string,string>={dashboard:'Tableau de bord',establishments:'Mes établissements',missions:'Mes missions',indemnities:'Mes indemnités'}

export default function DashboardViewNavigation(){
 const pathname=usePathname()
 useEffect(()=>{
  if(pathname!=='/dashboard')return
  const listeners:Array<()=>void>=[]
  function setup(){
   const nav=document.querySelector<HTMLElement>('.product-tabs')
   if(!nav)return
   const buttons=Array.from(nav.querySelectorAll<HTMLButtonElement>('button'))
   const bilans=buttons.find(b=>b.textContent?.trim()==='Mes bilans')
   const documents=buttons.find(b=>b.textContent?.trim()==='Mes documents')
   if(bilans&&bilans.disabled){bilans.disabled=false;const fn=()=>{window.location.href='/dashboard/bilans'};bilans.addEventListener('click',fn);listeners.push(()=>bilans.removeEventListener('click',fn))}
   if(documents&&documents.disabled){documents.disabled=false;const fn=()=>{window.location.href='/dashboard/documents'};documents.addEventListener('click',fn);listeners.push(()=>documents.removeEventListener('click',fn))}
   const wanted=new URLSearchParams(window.location.search).get('view')
   const label=wanted?VIEW_LABELS[wanted]:null
   if(label){const target=buttons.find(b=>b.textContent?.trim()===label);target?.click();window.history.replaceState({},'',window.location.pathname)}
  }
  const frame=requestAnimationFrame(setup)
  const observer=new MutationObserver(()=>setup())
  observer.observe(document.body,{childList:true,subtree:true})
  return()=>{cancelAnimationFrame(frame);observer.disconnect();listeners.forEach(fn=>fn())}
 },[pathname])
 return null
}
