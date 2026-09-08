'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { NAV_ICONS } from './navigation-icons'

type Item={key:string;label:string;short:string;href?:string;view?:string;icon:React.ReactNode;top?:boolean}

const ITEMS:Item[]=[
 {key:'dashboard',label:'Tableau de bord',short:'Accueil',view:'dashboard',icon:NAV_ICONS.dashboard},
 {key:'establishments',label:'Mes établissements',short:'Écoles',view:'establishments',icon:NAV_ICONS.establishments},
 {key:'missions',label:'Mes missions',short:'Missions',view:'missions',icon:NAV_ICONS.missions},
 {key:'indemnities',label:'Mes indemnités',short:'ISSR',view:'indemnities',icon:NAV_ICONS.indemnities},
 {key:'payroll',label:'Paie',short:'Paie',href:'/dashboard/paie',icon:NAV_ICONS.payroll,top:true},
 {key:'reports',label:'Mes bilans',short:'Bilans',href:'/dashboard/bilans',icon:NAV_ICONS.reports},
 {key:'documents',label:'Mes documents',short:'Docs',href:'/dashboard/documents',icon:NAV_ICONS.documents},
]

function keyFromLabel(label?:string|null){return ITEMS.find(item=>item.label===label)?.key??'dashboard'}

export default function MobileAppDock(){
 const pathname=usePathname(),router=useRouter(),dashboardRoute=pathname==='/dashboard'
 const routeKey=pathname.includes('/paie')||pathname.includes('/versements')||pathname.includes('/regularisation')?'payroll':pathname.includes('/bilans')?'reports':pathname.includes('/documents')?'documents':null
 const [activeKey,setActiveKey]=useState(routeKey??'dashboard')
 useEffect(()=>{if(routeKey){setActiveKey(routeKey);return}if(!dashboardRoute)return;const sync=()=>setActiveKey(keyFromLabel(document.querySelector('.product-tabs button.active')?.textContent?.trim()));sync();const observer=new MutationObserver(sync);const root=document.querySelector('.product-shell')??document.body;observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});return()=>observer.disconnect()},[dashboardRoute,routeKey])
 const scrollToTop=useCallback(()=>window.scrollTo({top:0,left:0,behavior:'auto'}),[])
 const activateDashboardView=useCallback((view:string,label:string)=>{setActiveKey(view);scrollToTop();if(!dashboardRoute){router.push(`/dashboard?view=${view}`,{scroll:true});return}const nav=document.querySelector('.product-tabs');const button=Array.from(nav?.querySelectorAll<HTMLButtonElement>('button')??[]).find(x=>x.textContent?.trim()===label);if(button){button.click();scrollToTop();return}router.push(`/dashboard?view=${view}`,{scroll:true})},[dashboardRoute,router,scrollToTop])
 const activateRoute=useCallback((key:string,href:string)=>{setActiveKey(key);scrollToTop();router.push(href,{scroll:true})},[router,scrollToTop])
 return <nav className="mobile-app-dock" aria-label="Navigation principale mobile">{ITEMS.map(item=>{const active=activeKey===item.key;return <button key={item.key} type="button" data-nav-key={item.key} className={`${active?'active':''} ${item.top?'top-feature-nav':''}`.trim()} aria-label={item.top?'Paie, top fonctionnalité':item.label} aria-current={active?'page':undefined} onClick={()=>item.href?activateRoute(item.key,item.href):activateDashboardView(item.view!,item.label)}><span className="mobile-app-dock-icon">{item.icon}{item.top&&<span className="top-feature-star" aria-hidden="true">★</span>}</span><span>{item.short}</span></button>})}</nav>
}
