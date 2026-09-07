'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Item={key:string;label:string;short:string;href?:string;view?:string;icon:React.ReactNode}

const outline={fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
const soft={fill:'currentColor',opacity:.14}
const mid={fill:'currentColor',opacity:.28}

const icons={
 dashboard:<svg viewBox="0 0 28 28" aria-hidden="true">
  <path {...soft} d="M4.5 12.1 14 4.7l9.5 7.4v10.5a2.2 2.2 0 0 1-2.2 2.2H6.7a2.2 2.2 0 0 1-2.2-2.2Z"/>
  <path {...mid} d="M11.1 24.8v-8.3h5.8v8.3Z"/>
  <path {...outline} d="m3.4 12.6 10.6-8.3 10.6 8.3M5 11.9v10.7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V11.9M11 24.6v-8.2h6v8.2"/>
  <path {...outline} d="M8.2 14.5h2.4M17.4 14.5h2.4"/>
 </svg>,
 establishments:<svg viewBox="0 0 28 28" aria-hidden="true">
  <path {...soft} d="M3.7 11.3h5.2v12.1H3.7zM19.1 11.3h5.2v12.1h-5.2zM8.9 8.4 14 5.2l5.1 3.2v15H8.9z"/>
  <path {...mid} d="M11.6 16.5h4.8v6.9h-4.8z"/>
  <path {...outline} d="M3.7 23.4V11.3h5.2M24.3 23.4V11.3h-5.2M8.9 23.4V8.4L14 5.2l5.1 3.2v15M2.8 23.4h22.4M11.6 23.4v-6.9h4.8v6.9"/>
  <path {...outline} d="M5.6 14.2h1.5M5.6 17.5h1.5M20.9 14.2h1.5M20.9 17.5h1.5M11.2 11.2h1.5M15.3 11.2h1.5"/>
  <circle cx="14" cy="7.9" r="1.05" {...outline}/>
  <path {...outline} d="M14 5.2V2.8h4.1v2.1H14"/>
 </svg>,
 missions:<svg viewBox="0 0 28 28" aria-hidden="true">
  <rect x="4.5" y="6.2" width="19" height="17.1" rx="3.5" {...soft}/>
  <path {...outline} d="M8.2 4v4M19.8 4v4M5.3 10.2h17.4M7 6.2h14a2.4 2.4 0 0 1 2.4 2.4v12.1a2.4 2.4 0 0 1-2.4 2.4H7a2.4 2.4 0 0 1-2.4-2.4V8.6A2.4 2.4 0 0 1 7 6.2Z"/>
  <circle cx="18.6" cy="18" r="4.2" {...mid}/><path {...outline} d="m16.7 18 1.4 1.4 2.6-3"/>
 </svg>,
 indemnities:<svg viewBox="0 0 28 28" aria-hidden="true">
  <path {...soft} d="M5.3 3.8h12.4l4.7 4.7v15.7H5.3z"/>
  <path {...outline} d="M5.5 3.9h11.8l5.1 5v15.2H5.5zM17.3 3.9v5h5.1M8.6 12h6.1M8.6 15.3h5"/>
  <circle cx="19.9" cy="19.5" r="5.1" {...mid}/>
  <path {...outline} d="M21.5 16.7c-.6-.5-1.3-.7-2-.7-1.8 0-3 1.5-3 3.6s1.2 3.6 3 3.6c.8 0 1.5-.2 2.1-.7M16.2 18.6h4.1M16.2 20.5h3.7"/>
 </svg>,
 reports:<svg viewBox="0 0 28 28" aria-hidden="true">
  <rect x="4.1" y="16.3" width="4.2" height="8" rx="1.2" {...mid}/><rect x="11.8" y="11.3" width="4.2" height="13" rx="1.2" {...mid}/><rect x="19.5" y="6.5" width="4.2" height="17.8" rx="1.2" {...mid}/>
  <path {...outline} d="M4.5 24.4V17h3.4v7.4M12.2 24.4V12h3.4v12.4M19.9 24.4V7.2h3.4v17.2M3.7 24.4h21"/>
  <path {...outline} d="M5.2 13.6c4.4-.7 8.6-2.9 12.1-6.4l4.5-4.5M18.7 2.7h3.2v3.2"/>
 </svg>,
 documents:<svg viewBox="0 0 28 28" aria-hidden="true">
  <path {...soft} d="M4.7 9.2h8.1l2-2.4h8.5a2.1 2.1 0 0 1 2.1 2.1v13.4a2.1 2.1 0 0 1-2.1 2.1H4.7z"/>
  <path {...outline} d="M4.7 9.2h8.1l2-2.4h8.5a2.1 2.1 0 0 1 2.1 2.1v13.4a2.1 2.1 0 0 1-2.1 2.1H4.7z"/>
  <path {...mid} d="M9.4 3.4h9.5l3 3.1v7.1H9.4z"/><path {...outline} d="M9.4 3.4h9.5l3 3.1v7.1M18.9 3.4v3.2H22"/>
 </svg>,
}

const ITEMS:Item[]=[
 {key:'dashboard',label:'Tableau de bord',short:'Accueil',view:'dashboard',icon:icons.dashboard},
 {key:'establishments',label:'Mes établissements',short:'Écoles',view:'establishments',icon:icons.establishments},
 {key:'missions',label:'Mes missions',short:'Missions',view:'missions',icon:icons.missions},
 {key:'indemnities',label:'Mes indemnités',short:'ISSR',view:'indemnities',icon:icons.indemnities},
 {key:'reports',label:'Mes bilans',short:'Bilans',href:'/dashboard/bilans',icon:icons.reports},
 {key:'documents',label:'Mes documents',short:'Docs',href:'/dashboard/documents',icon:icons.documents},
]

function keyFromLabel(label?:string|null){return ITEMS.find(item=>item.label===label)?.key??'dashboard'}

export default function MobileAppDock(){
 const pathname=usePathname()
 const router=useRouter()
 const dashboardRoute=pathname==='/dashboard'
 const routeKey=pathname.includes('/bilans')?'reports':pathname.includes('/documents')?'documents':null
 const [activeKey,setActiveKey]=useState(routeKey??'dashboard')

 useEffect(()=>{
  if(routeKey){setActiveKey(routeKey);return}
  if(!dashboardRoute)return
  const sync=()=>setActiveKey(keyFromLabel(document.querySelector('.product-tabs button.active')?.textContent?.trim()))
  sync()
  const observer=new MutationObserver(sync)
  const root=document.querySelector('.product-shell')??document.body
  observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  return()=>observer.disconnect()
 },[dashboardRoute,routeKey])

 const scrollToTop=useCallback(()=>window.scrollTo({top:0,left:0,behavior:'auto'}),[])
 const activateDashboardView=useCallback((view:string,label:string)=>{
  setActiveKey(view)
  scrollToTop()
  if(!dashboardRoute){router.push(`/dashboard?view=${view}`,{scroll:true});return}
  const nav=document.querySelector('.product-tabs')
  const button=Array.from(nav?.querySelectorAll<HTMLButtonElement>('button')??[]).find(x=>x.textContent?.trim()===label)
  if(button){button.click();scrollToTop();return}
  router.push(`/dashboard?view=${view}`,{scroll:true})
 },[dashboardRoute,router,scrollToTop])

 const activateRoute=useCallback((key:string,href:string)=>{
  setActiveKey(key)
  scrollToTop()
  router.push(href,{scroll:true})
 },[router,scrollToTop])

 return <nav className="mobile-app-dock" aria-label="Navigation principale mobile">
  {ITEMS.map(item=>{
   const active=activeKey===item.key
   return <button key={item.key} type="button" data-nav-key={item.key} className={active?'active':''} aria-label={item.label} aria-current={active?'page':undefined} onClick={()=>item.href?activateRoute(item.key,item.href):activateDashboardView(item.view!,item.label)}>
    <span className="mobile-app-dock-icon">{item.icon}</span><span>{item.short}</span>
   </button>
  })}
 </nav>
}
