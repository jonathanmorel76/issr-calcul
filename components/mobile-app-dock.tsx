'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Item={key:string;label:string;short:string;href?:string;view?:string;icon:React.ReactNode}

const stroke={fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
const icons={
 dashboard:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...stroke} d="M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z"/></svg>,
 establishments:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...stroke} d="M4 20V8l8-4 8 4v12M8 20v-6h8v6M9 10h.01M15 10h.01"/></svg>,
 missions:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...stroke} d="M7 4v3m10-3v3M4.5 9.5h15M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3 7h3v3H8v-3Z"/></svg>,
 indemnities:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...stroke} d="M4 7h16v11H4V7Zm0 3h16M8 15h4M17 14.5h.01"/></svg>,
 reports:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...stroke} d="M5 20V10m7 10V4m7 16v-7M3 20h18"/></svg>,
 documents:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...stroke} d="M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5m-5 4h5"/></svg>,
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

 const activateDashboardView=useCallback((view:string,label:string)=>{
  setActiveKey(view)
  if(!dashboardRoute){router.push(`/dashboard?view=${view}`);return}
  const nav=document.querySelector('.product-tabs')
  const button=Array.from(nav?.querySelectorAll<HTMLButtonElement>('button')??[]).find(x=>x.textContent?.trim()===label)
  if(button){button.click();return}
  router.push(`/dashboard?view=${view}`)
 },[dashboardRoute,router])

 return <nav className="mobile-app-dock" aria-label="Navigation principale mobile">
  {ITEMS.map(item=>{
   const active=activeKey===item.key
   return <button key={item.key} type="button" className={active?'active':''} aria-label={item.label} aria-current={active?'page':undefined} onClick={()=>item.href?(setActiveKey(item.key),router.push(item.href)):activateDashboardView(item.view!,item.label)}>
    <span className="mobile-app-dock-icon">{item.icon}</span><span>{item.short}</span>
   </button>
  })}
 </nav>
}
