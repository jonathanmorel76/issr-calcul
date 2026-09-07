'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Item={key:string;label:string;short:string;href?:string;view?:string;icon:React.ReactNode}

const stroke={fill:'none',stroke:'currentColor',strokeWidth:1.75,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
const accent={fill:'currentColor',opacity:.12}
const icons={
 dashboard:<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2" {...accent}/><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.8" {...accent}/><path {...stroke} d="M4.5 4.5h5v5h-5zM14.5 4.5h5v2.5h-5zM4.5 13h5v6.5h-5zM14.5 10.5h5v9h-5z"/><path {...stroke} d="M6 15.5h2M16 13h2"/></svg>,
 establishments:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...accent} d="M4 9.2 12 5l8 4.2V20H4z"/><path {...stroke} d="M3.5 9.5 12 5l8.5 4.5M5 9v11h14V9M9 20v-5.5h6V20M8 11h1.5M14.5 11H16"/><path {...stroke} d="M18.5 6.5c0-1.6 1.3-2.8 2.8-2.8s2.8 1.2 2.8 2.8c0 2.1-2.8 4.7-2.8 4.7s-2.8-2.6-2.8-4.7Z" transform="translate(-2.2 .4) scale(.72)"/></svg>,
 missions:<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="3" {...accent}/><path {...stroke} d="M7 3.5v3M17 3.5v3M5 8.5h14M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v10.5A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 5 6.5Z"/><path {...stroke} d="m8 13 2.1 2.1L16 10"/></svg>,
 indemnities:<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5.5" {...accent}/><path {...stroke} d="M14.5 7.5h4A1.5 1.5 0 0 1 20 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 17.5V17M7.7 8.6c-.6-.5-1.2-.7-2-.7-1.8 0-3 1.5-3 4s1.2 4 3 4c.8 0 1.5-.2 2.1-.8M2.4 11h4.2M2.4 13h3.8M13 11h4M13 14h3"/></svg>,
 reports:<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.8" y="4" width="16.4" height="16" rx="3" {...accent}/><path {...stroke} d="M5 20V9.5M10 20v-5.5M15 20V6.5M20 20v-8M4 20h17"/><path {...stroke} d="m6 8 3-2 3 1.5 4-3 3 1"/></svg>,
 documents:<svg viewBox="0 0 24 24" aria-hidden="true"><path {...accent} d="M7 3.5h7.5L19 8v12.5H7z"/><path {...stroke} d="M7 3.5h7.5L19 8v12.5H7zM14.5 3.5V8H19M10 11.5h6M10 14.5h6M10 17.5h4"/><path {...stroke} d="M5 6.5H4.5A1.5 1.5 0 0 0 3 8v11A1.5 1.5 0 0 0 4.5 20H5"/></svg>,
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
