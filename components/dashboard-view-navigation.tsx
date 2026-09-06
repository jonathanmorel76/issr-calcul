'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const VIEW_LABELS:Record<string,string>={dashboard:'Tableau de bord',establishments:'Mes établissements',missions:'Mes missions',indemnities:'Mes indemnités'}

export default function DashboardViewNavigation(){
 const pathname=usePathname()
 useEffect(()=>{
  if(pathname!=='/dashboard')return
  let queryApplied=false
  let scheduled=false

  function ensureRouteTab(nav:HTMLElement,label:string,href:string){
   const native=Array.from(nav.querySelectorAll<HTMLButtonElement>('button')).find(button=>button.textContent?.trim()===label)
   if(native){
    native.style.display='none'
    native.setAttribute('aria-hidden','true')
    native.tabIndex=-1
   }

   let link=Array.from(nav.querySelectorAll<HTMLAnchorElement>('a.mr-persistent-route-tab')).find(anchor=>anchor.textContent?.trim()===label)
   if(!link){
    link=document.createElement('a')
    link.className='mr-persistent-route-tab'
    link.textContent=label
    link.href=href
    nav.appendChild(link)
   }else if(link.getAttribute('href')!==href){
    link.href=href
   }
  }

  function setup(){
   scheduled=false
   const nav=document.querySelector<HTMLElement>('.product-tabs')
   if(!nav)return

   ensureRouteTab(nav,'Mes bilans','/dashboard/bilans')
   ensureRouteTab(nav,'Mes documents','/dashboard/documents')

   if(!queryApplied){
    const wanted=new URLSearchParams(window.location.search).get('view')
    const label=wanted?VIEW_LABELS[wanted]:null
    if(label){
     const target=Array.from(nav.querySelectorAll<HTMLButtonElement>('button')).find(button=>button.textContent?.trim()===label)
     if(target){
      queryApplied=true
      target.click()
      window.history.replaceState({},'',window.location.pathname)
     }
    }
   }
  }

  function scheduleSetup(){
   if(scheduled)return
   scheduled=true
   requestAnimationFrame(setup)
  }

  scheduleSetup()
  const observer=new MutationObserver(scheduleSetup)
  observer.observe(document.body,{childList:true,subtree:true})
  window.addEventListener('popstate',scheduleSetup)
  return()=>{observer.disconnect();window.removeEventListener('popstate',scheduleSetup)}
 },[pathname])
 return null
}
