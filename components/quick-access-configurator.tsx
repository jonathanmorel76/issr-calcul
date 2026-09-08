'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type QuickKey='establishments'|'missions'|'indemnities'|'payroll'|'reports'|'documents'
type QuickItem={key:QuickKey;label:string;short:string;description:string;icon:React.ReactNode;href?:string;view?:string;top?:boolean}

const outline={fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
const soft={fill:'currentColor',opacity:.14}
const mid={fill:'currentColor',opacity:.28}
const icons={
 establishments:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M3.7 11.3h5.2v12.1H3.7zM19.1 11.3h5.2v12.1h-5.2zM8.9 8.4 14 5.2l5.1 3.2v15H8.9z"/><path {...mid} d="M11.6 16.5h4.8v6.9h-4.8z"/><path {...outline} d="M3.7 23.4V11.3h5.2M24.3 23.4V11.3h-5.2M8.9 23.4V8.4L14 5.2l5.1 3.2v15M2.8 23.4h22.4M11.6 23.4v-6.9h4.8v6.9"/></svg>,
 missions:<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4.5" y="6.2" width="19" height="17.1" rx="3.5" {...soft}/><path {...outline} d="M8.2 4v4M19.8 4v4M5.3 10.2h17.4M7 6.2h14a2.4 2.4 0 0 1 2.4 2.4v12.1a2.4 2.4 0 0 1-2.4 2.4H7a2.4 2.4 0 0 1-2.4-2.4V8.6A2.4 2.4 0 0 1 7 6.2Z"/><circle cx="18.6" cy="18" r="4.2" {...mid}/><path {...outline} d="m16.7 18 1.4 1.4 2.6-3"/></svg>,
 indemnities:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M5.3 3.8h12.4l4.7 4.7v15.7H5.3z"/><path {...outline} d="M5.5 3.9h11.8l5.1 5v15.2H5.5zM17.3 3.9v5h5.1M8.6 12h6.1M8.6 15.3h5"/><circle cx="19.9" cy="19.5" r="5.1" {...mid}/><path {...outline} d="M21.5 16.7c-.6-.5-1.3-.7-2-.7-1.8 0-3 1.5-3 3.6s1.2 3.6 3 3.6c.8 0 1.5-.2 2.1-.7M16.2 18.6h4.1M16.2 20.5h3.7"/></svg>,
 payroll:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M5 4h14l4 4v16H5z"/><path {...outline} d="M5.5 4.2h13l4 4v15.5h-17zM18.5 4.2v4h4M9 12h9M9 15.5h7"/><circle cx="19.8" cy="19.2" r="4.7" {...mid}/><path {...outline} d="M21.1 16.8c-.5-.4-1.1-.6-1.8-.6-1.6 0-2.7 1.3-2.7 3s1.1 3 2.7 3c.7 0 1.3-.2 1.8-.6M16.3 18.5h3.5M16.3 20h3.2"/></svg>,
 reports:<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4.1" y="16.3" width="4.2" height="8" rx="1.2" {...mid}/><rect x="11.8" y="11.3" width="4.2" height="13" rx="1.2" {...mid}/><rect x="19.5" y="6.5" width="4.2" height="17.8" rx="1.2" {...mid}/><path {...outline} d="M4.5 24.4V17h3.4v7.4M12.2 24.4V12h3.4v12.4M19.9 24.4V7.2h3.4v17.2M3.7 24.4h21"/></svg>,
 documents:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M4.7 9.2h8.1l2-2.4h8.5a2.1 2.1 0 0 1 2.1 2.1v13.4a2.1 2.1 0 0 1-2.1 2.1H4.7z"/><path {...outline} d="M4.7 9.2h8.1l2-2.4h8.5a2.1 2.1 0 0 1 2.1 2.1v13.4a2.1 2.1 0 0 1-2.1 2.1H4.7z"/><path {...mid} d="M9.4 3.4h9.5l3 3.1v7.1H9.4z"/><path {...outline} d="M9.4 3.4h9.5l3 3.1v7.1M18.9 3.4v3.2H22"/></svg>,
}

const STORAGE_KEY='mr-quick-access-v1'
const DEFAULT_KEYS:QuickKey[]=['establishments','missions','indemnities']
const ITEMS:QuickItem[]=[
 {key:'establishments',label:'Mes établissements',short:'Écoles',description:'Gérer mes établissements',icon:icons.establishments,view:'establishments'},
 {key:'missions',label:'Mes missions',short:'Missions',description:'Planifier un remplacement',icon:icons.missions,view:'missions'},
 {key:'indemnities',label:'Mes indemnités',short:'ISSR',description:'Contrôler mes indemnités',icon:icons.indemnities,view:'indemnities'},
 {key:'payroll',label:'Paie',short:'Paie',description:'Comparer droits et versements',icon:icons.payroll,href:'/dashboard/paie',top:true},
 {key:'reports',label:'Mes bilans',short:'Bilans',description:'Consulter mes bilans',icon:icons.reports,href:'/dashboard/bilans'},
 {key:'documents',label:'Mes documents',short:'Docs',description:'Retrouver mes documents',icon:icons.documents,href:'/dashboard/documents'},
]

function validKeys(value:unknown):QuickKey[]|null{
 if(!Array.isArray(value))return null
 const keys=value.filter((x):x is QuickKey=>typeof x==='string'&&ITEMS.some(item=>item.key===x))
 return keys.length===3&&new Set(keys).size===3?keys:null
}

export default function QuickAccessConfigurator(){
 const [mount,setMount]=useState<HTMLElement|null>(null)
 const [selected,setSelected]=useState<QuickKey[]>(DEFAULT_KEYS)
 const [draft,setDraft]=useState<QuickKey[]>(DEFAULT_KEYS)
 const [open,setOpen]=useState(false)

 useEffect(()=>{try{const saved=validKeys(JSON.parse(window.localStorage.getItem(STORAGE_KEY)??'null'));if(saved){setSelected(saved);setDraft(saved)}}catch{}},[])
 useEffect(()=>{
  let scheduled=false
  const sync=()=>{scheduled=false;const panel=document.querySelector<HTMLElement>('.quick-panel.widget-quick');if(!panel){setMount(null);return}panel.dataset.quickConfigured='1';let host=panel.querySelector<HTMLElement>(':scope > .quick-access-config-host');if(!host){host=document.createElement('div');host.className='quick-access-config-host';panel.appendChild(host)}setMount(host)}
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
  schedule();const observer=new MutationObserver(schedule);observer.observe(document.body,{subtree:true,childList:true});return()=>{observer.disconnect();document.querySelectorAll('.quick-panel[data-quick-configured="1"]').forEach(panel=>{delete (panel as HTMLElement).dataset.quickConfigured;panel.querySelector(':scope > .quick-access-config-host')?.remove()})}
 },[])
 const shown=useMemo(()=>selected.map(key=>ITEMS.find(item=>item.key===key)!).filter(Boolean),[selected])
 function navigate(item:QuickItem){const dock=document.querySelector<HTMLButtonElement>(`.mobile-app-dock [data-nav-key="${item.key}"]`);if(dock){dock.click();return}if(item.href){window.location.assign(item.href);return}const button=Array.from(document.querySelectorAll<HTMLButtonElement>('.product-tabs button')).find(x=>x.textContent?.trim()===item.label);if(button){button.click();window.scrollTo({top:0,left:0,behavior:'auto'});return}window.location.assign(`/dashboard?view=${item.view}`)}
 function toggle(key:QuickKey){setDraft(current=>current.includes(key)?current.filter(x=>x!==key):current.length<3?[...current,key]:current)}
 function openFilter(){setDraft(selected);setOpen(true)}
 function save(){if(draft.length!==3)return;setSelected(draft);try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(draft))}catch{}setOpen(false)}
 if(!mount)return null
 return createPortal(<div className="quick-access-configurator">
  <div className="quick-access-head">
   <div><span className="eyebrow">Navigation</span><h2>Accès rapides</h2></div>
   <button type="button" className="quick-access-filter" onClick={openFilter} aria-label="Choisir mes trois accès rapides"><span className="quick-filter-icon" aria-hidden="true">☷</span><span>Filtrer</span></button>
  </div>
  <div className="quick-access-list">
   {shown.map(item=><button key={item.key} type="button" className={`quick-access-item ${item.top?'top-feature':''}`} onClick={()=>navigate(item)}>
    <span className="quick-access-icon" aria-hidden="true">{item.icon}{item.top&&<span className="quick-access-icon-star">★</span>}</span>
    <span className="quick-access-copy"><strong>{item.short}</strong><small>{item.description}</small></span>
    <span className="quick-access-arrow" aria-hidden="true">→</span>
   </button>)}
  </div>
  {open&&<div className="quick-access-picker" role="dialog" aria-label="Choisir trois accès rapides">
   <div className="quick-access-picker-head"><div><strong>Choisir mes accès</strong><small>Sélectionnez exactement 3 menus.</small></div><span>{draft.length}/3</span></div>
   <div className="quick-access-options">{ITEMS.map(item=>{const active=draft.includes(item.key),blocked=!active&&draft.length>=3;return <button key={item.key} type="button" className={`${active?'selected':''} ${item.top?'top-feature':''}`.trim()} disabled={blocked} onClick={()=>toggle(item.key)}><span className="quick-access-option-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.short}{item.top?' ★':''}</strong><small>{item.label}</small></span><b>{active?'✓':'+'}</b></button>})}</div>
   <div className="quick-access-picker-actions"><button type="button" className="btn btn-secondary" onClick={()=>setOpen(false)}>Annuler</button><button type="button" className="btn quick-access-save" style={{background:'#e9f3f2',color:'#164f55',border:'1px solid #bfd4d2',fontWeight:800}} disabled={draft.length!==3} onClick={save}>Enregistrer mes 3 accès</button></div>
  </div>}
 </div>,mount)
}
