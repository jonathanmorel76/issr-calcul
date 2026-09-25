'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function DashboardViewNavigation(){
 const pathname=usePathname()
 const router=useRouter()
 useEffect(()=>{
  if(pathname!=='/dashboard')return
  let scheduled=false

  router.prefetch('/dashboard/paie')
  router.prefetch('/dashboard/bilans')
  router.prefetch('/dashboard/documents')

  function ensureRouteTab(nav:HTMLElement,label:string,href:string,insertBeforeLabel?:string){
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
    link.addEventListener('click',event=>{
     event.preventDefault()
     router.push(href)
    })
    const before=insertBeforeLabel?Array.from(nav.querySelectorAll<HTMLElement>('a,button')).find(el=>el.textContent?.trim()===insertBeforeLabel):null
    if(before)nav.insertBefore(link,before)
    else nav.appendChild(link)
   }else if(link.getAttribute('href')!==href){
    link.href=href
   }
  }

  function setup(){
   scheduled=false
   const nav=document.querySelector<HTMLElement>('.product-tabs')
   if(!nav)return

   ensureRouteTab(nav,'Paie','/dashboard/paie','Mes bilans')
   ensureRouteTab(nav,'Mes bilans','/dashboard/bilans','Mes documents')
   ensureRouteTab(nav,'Mes documents','/dashboard/documents')

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
 },[pathname,router])
 return null
}
