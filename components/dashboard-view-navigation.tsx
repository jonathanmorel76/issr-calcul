'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const VIEW_LABELS:Record<string,string>={dashboard:'Tableau de bord',establishments:'Mes établissements',missions:'Mes missions',indemnities:'Mes indemnités'}

export default function DashboardViewNavigation(){
 const pathname=usePathname()
 useEffect(()=>{
  if(pathname!=='/dashboard')return
  const bound=new WeakSet<HTMLButtonElement>()
  let queryApplied=false

  function bindRouteButton(button:HTMLButtonElement|undefined,href:string){
   if(!button)return
   if(button.disabled)button.disabled=false
   button.removeAttribute('disabled')
   button.setAttribute('aria-disabled','false')
   if(bound.has(button))return
   button.addEventListener('click',()=>{window.location.href=href})
   bound.add(button)
  }

  function setup(){
   const nav=document.querySelector<HTMLElement>('.product-tabs')
   if(!nav)return
   const buttons=Array.from(nav.querySelectorAll<HTMLButtonElement>('button'))
   bindRouteButton(buttons.find(b=>b.textContent?.trim()==='Mes bilans'),'/dashboard/bilans')
   bindRouteButton(buttons.find(b=>b.textContent?.trim()==='Mes documents'),'/dashboard/documents')

   if(!queryApplied){
    const wanted=new URLSearchParams(window.location.search).get('view')
    const label=wanted?VIEW_LABELS[wanted]:null
    if(label){
     const target=buttons.find(b=>b.textContent?.trim()===label)
     if(target){
      queryApplied=true
      target.click()
      window.history.replaceState({},'',window.location.pathname)
     }
    }
   }
  }

  const frame=requestAnimationFrame(setup)
  const observer=new MutationObserver(()=>requestAnimationFrame(setup))
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']})
  window.addEventListener('popstate',setup)
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('popstate',setup)}
 },[pathname])
 return null
}
