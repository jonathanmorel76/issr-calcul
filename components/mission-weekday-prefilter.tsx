'use client'

import { useEffect } from 'react'

const DAYS=[
  {key:'lun.',label:'Lun'},
  {key:'mar.',label:'Mar'},
  {key:'mer.',label:'Mer'},
  {key:'jeu.',label:'Jeu'},
  {key:'ven.',label:'Ven'},
]

function ensurePrefilter(planner:HTMLElement){
  if(planner.querySelector('.mission-weekday-prefilter'))return
  const grid=planner.querySelector<HTMLElement>('.day-grid')
  if(!grid)return

  const wrap=document.createElement('div')
  wrap.className='mission-weekday-prefilter'
  wrap.innerHTML='<div class="weekday-prefilter-copy"><strong>Jours habituels de remplacement</strong><small>Préfiltrez les jours récurrents de la mission avant d’ajuster les dates une par une.</small></div>'
  const actions=document.createElement('div')
  actions.className='weekday-prefilter-actions'

  DAYS.forEach(day=>{
    const button=document.createElement('button')
    button.type='button'
    button.className='weekday-chip active'
    button.setAttribute('aria-pressed','true')
    button.textContent=day.label
    button.addEventListener('click',()=>{
      const willEnable=!button.classList.contains('active')
      button.classList.toggle('active',willEnable)
      button.setAttribute('aria-pressed',String(willEnable))

      const labels=Array.from(grid.querySelectorAll<HTMLLabelElement>('label'))
      labels.forEach(label=>{
        const text=label.querySelector('span')?.textContent?.trim().toLowerCase()??''
        if(!text.startsWith(day.key))return
        if(label.classList.contains('holiday'))return
        const input=label.querySelector<HTMLInputElement>('input[type="checkbox"]')
        if(!input)return
        if(willEnable&&!input.checked)input.click()
        if(!willEnable&&input.checked)input.click()
      })
    })
    actions.appendChild(button)
  })

  const shortcuts=document.createElement('div')
  shortcuts.className='weekday-prefilter-shortcuts'

  const all=document.createElement('button')
  all.type='button'
  all.textContent='Tous les jours'
  all.addEventListener('click',()=>{
    actions.querySelectorAll<HTMLButtonElement>('.weekday-chip').forEach(button=>{
      if(!button.classList.contains('active'))button.click()
    })
  })

  const none=document.createElement('button')
  none.type='button'
  none.textContent='Aucun'
  none.addEventListener('click',()=>{
    actions.querySelectorAll<HTMLButtonElement>('.weekday-chip').forEach(button=>{
      if(button.classList.contains('active'))button.click()
    })
  })

  shortcuts.append(all,none)
  wrap.append(actions,shortcuts)
  grid.insertAdjacentElement('beforebegin',wrap)
}

export default function MissionWeekdayPrefilter(){
  useEffect(()=>{
    const scan=()=>document.querySelectorAll<HTMLElement>('.mission-planner').forEach(ensurePrefilter)
    scan()
    const observer=new MutationObserver(scan)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])
  return null
}
