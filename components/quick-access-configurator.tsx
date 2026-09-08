'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type QuickKey='establishments'|'missions'|'indemnities'|'payroll'|'reports'|'documents'
type QuickItem={key:QuickKey;label:string;short:string;description:string;icon:string;href?:string;view?:string;top?:boolean}

const STORAGE_KEY='mr-quick-access-v1'
const DEFAULT_KEYS:QuickKey[]=['establishments','missions','indemnities']
const ITEMS:QuickItem[]=[
 {key:'establishments',label:'Mes établissements',short:'Écoles',description:'Gérer mes établissements',icon:'🏫',view:'establishments'},
 {key:'missions',label:'Mes missions',short:'Missions',description:'Planifier un remplacement',icon:'📅',view:'missions'},
 {key:'indemnities',label:'Mes indemnités',short:'ISSR',description:'Contrôler mes indemnités',icon:'€',view:'indemnities'},
 {key:'payroll',label:'Paie',short:'Paie',description:'Comparer droits et versements',icon:'★',href:'/dashboard/paie',top:true},
 {key:'reports',label:'Mes bilans',short:'Bilans',description:'Consulter mes bilans',icon:'▥',href:'/dashboard/bilans'},
 {key:'documents',label:'Mes documents',short:'Docs',description:'Retrouver mes documents',icon:'📁',href:'/dashboard/documents'},
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

 useEffect(()=>{
  try{const saved=validKeys(JSON.parse(window.localStorage.getItem(STORAGE_KEY)??'null'));if(saved){setSelected(saved);setDraft(saved)}}catch{}
 },[])

 useEffect(()=>{
  let scheduled=false
  const sync=()=>{
   scheduled=false
   const panel=document.querySelector<HTMLElement>('.quick-panel.widget-quick')
   if(!panel){setMount(null);return}
   panel.dataset.quickConfigured='1'
   let host=panel.querySelector<HTMLElement>(':scope > .quick-access-config-host')
   if(!host){host=document.createElement('div');host.className='quick-access-config-host';panel.appendChild(host)}
   setMount(host)
  }
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
  schedule()
  const observer=new MutationObserver(schedule)
  observer.observe(document.body,{subtree:true,childList:true})
  return()=>{observer.disconnect();document.querySelectorAll('.quick-panel[data-quick-configured="1"]').forEach(panel=>{delete (panel as HTMLElement).dataset.quickConfigured;panel.querySelector(':scope > .quick-access-config-host')?.remove()})}
 },[])

 const shown=useMemo(()=>selected.map(key=>ITEMS.find(item=>item.key===key)!).filter(Boolean),[selected])

 function navigate(item:QuickItem){
  const dock=document.querySelector<HTMLButtonElement>(`.mobile-app-dock [data-nav-key="${item.key}"]`)
  if(dock){dock.click();return}
  if(item.href){window.location.assign(item.href);return}
  const button=Array.from(document.querySelectorAll<HTMLButtonElement>('.product-tabs button')).find(x=>x.textContent?.trim()===item.label)
  if(button){button.click();window.scrollTo({top:0,left:0,behavior:'auto'});return}
  window.location.assign(`/dashboard?view=${item.view}`)
 }

 function toggle(key:QuickKey){
  setDraft(current=>current.includes(key)?current.filter(x=>x!==key):current.length<3?[...current,key]:current)
 }

 function openFilter(){setDraft(selected);setOpen(true)}
 function save(){if(draft.length!==3)return;setSelected(draft);try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(draft))}catch{}setOpen(false)}

 if(!mount)return null
 return createPortal(<div className="quick-access-configurator">
  <div className="quick-access-head">
   <div><span className="eyebrow">Accès rapides</span><h2>Mes raccourcis</h2></div>
   <button type="button" className="quick-access-filter" onClick={openFilter} aria-label="Choisir mes trois accès rapides"><span aria-hidden="true">☰</span> Filtrer</button>
  </div>
  <div className="quick-access-list">
   {shown.map(item=><button key={item.key} type="button" className={`quick-access-item ${item.top?'top-feature':''}`} onClick={()=>navigate(item)}>
    <span className="quick-access-icon" aria-hidden="true">{item.icon}</span>
    <span className="quick-access-copy"><strong>{item.short}{item.top&&<small className="quick-access-star"> ★</small>}</strong><small>{item.description}</small></span>
    <b aria-hidden="true">→</b>
   </button>)}
  </div>
  {open&&<div className="quick-access-picker" role="dialog" aria-label="Choisir trois accès rapides">
   <div className="quick-access-picker-head"><div><strong>Choisir mes accès</strong><small>Sélectionnez exactement 3 menus.</small></div><span>{draft.length}/3</span></div>
   <div className="quick-access-options">{ITEMS.map(item=>{const active=draft.includes(item.key);const blocked=!active&&draft.length>=3;return <button key={item.key} type="button" className={`${active?'selected':''} ${item.top?'top-feature':''}`.trim()} disabled={blocked} onClick={()=>toggle(item.key)}><span className="quick-access-option-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.short}{item.top?' ★':''}</strong><small>{item.label}</small></span><b>{active?'✓':'+'}</b></button>})}</div>
   <div className="quick-access-picker-actions"><button type="button" className="btn btn-secondary" onClick={()=>setOpen(false)}>Annuler</button><button type="button" className="btn btn-primary" disabled={draft.length!==3} onClick={save}>Enregistrer mes 3 accès</button></div>
  </div>}
 </div>,mount)
}
