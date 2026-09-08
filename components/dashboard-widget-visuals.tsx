'use client'

import { useEffect } from 'react'

type WidgetVisual={
  selector:string
  headingSelector:string
  tone:string
  label:string
  icon:string
  replaceSelector?:string
  preserveCount?:boolean
}

const icons={
  calendar:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 8.5h15M5.5 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="m8.5 14 2.1 2.1 4.8-5"/></svg>`,
  shield:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.2c0 4.4 2.8 7.7 7 9.8 4.2-2.1 7-5.4 7-9.8V6l-7-3Z"/><path d="m8.7 12.2 2.1 2.1 4.6-4.8"/></svg>`,
  activity:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="m4 7 4-3 5 4 5-4"/></svg>`,
  money:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h10l3 3V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M16 3.5V7h3M8 10.5h5M8 14h3"/><circle cx="15.5" cy="15.5" r="3"/><path d="M14.5 15.5h2"/></svg>`,
  school:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20.5h18M5 20.5V10l7-4 7 4v10.5M9 20.5v-6h6v6M3.5 10.5 12 5l8.5 5.5"/><path d="M12 5V2.8l3 1.2-3 1"/></svg>`,
  grid:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/></svg>`,
}

const visuals:WidgetVisual[]=[
  {selector:'.widget-next',headingSelector:'.widget-heading',tone:'planning',label:'Planning',icon:icons.calendar,replaceSelector:'.status-chip'},
  {selector:'.widget-attention',headingSelector:'.widget-heading',tone:'attention',label:'Suivi à vérifier',icon:icons.shield,replaceSelector:'.attention-count',preserveCount:true},
  {selector:'.widget-activity',headingSelector:'.widget-heading',tone:'activity',label:'Activité du mois',icon:icons.activity},
  {selector:'.widget-money',headingSelector:'.widget-heading',tone:'finance',label:'Suivi financier',icon:icons.money},
  {selector:'.widget-establishments',headingSelector:'.widget-heading',tone:'school',label:'Établissements',icon:icons.school},
  {selector:'.widget-quick',headingSelector:':scope > div:first-child',tone:'quick',label:'Accès rapides',icon:icons.grid},
]

function installVisual(config:WidgetVisual){
  document.querySelectorAll<HTMLElement>(config.selector).forEach(widget=>{
    const heading=widget.querySelector<HTMLElement>(config.headingSelector)
    if(!heading)return

    let count=''
    if(config.replaceSelector){
      const legacy=heading.querySelector<HTMLElement>(config.replaceSelector)
      if(legacy){
        if(config.preserveCount&&/^\d+$/.test((legacy.textContent||'').trim()))count=(legacy.textContent||'').trim()
        legacy.remove()
      }
    }

    const existing=heading.querySelector<HTMLElement>('.widget-type-icon')
    if(existing){
      if(config.preserveCount){
        const badge=existing.querySelector<HTMLElement>('.widget-type-icon-count')
        if(count){
          if(badge)badge.textContent=count
          else existing.insertAdjacentHTML('beforeend',`<span class="widget-type-icon-count">${count}</span>`)
        }else badge?.remove()
      }
      return
    }

    const marker=document.createElement('span')
    marker.className=`widget-type-icon widget-type-icon--${config.tone}`
    marker.setAttribute('role','img')
    marker.setAttribute('aria-label',config.label)
    marker.title=config.label
    marker.innerHTML=`${config.icon}${count?`<span class="widget-type-icon-count">${count}</span>`:''}`
    heading.appendChild(marker)
  })
}

function applyWidgetVisuals(){visuals.forEach(installVisual)}

export default function DashboardWidgetVisuals(){
  useEffect(()=>{
    let frame=0
    const schedule=()=>{
      cancelAnimationFrame(frame)
      frame=requestAnimationFrame(applyWidgetVisuals)
    }
    schedule()
    const observer=new MutationObserver(schedule)
    observer.observe(document.body,{childList:true,subtree:true})
    window.addEventListener('popstate',schedule)
    return()=>{
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('popstate',schedule)
    }
  },[])
  return null
}
