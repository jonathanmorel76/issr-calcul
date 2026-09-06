'use client'

import { useEffect } from 'react'

const ART:Record<string,string>={
 dashboard:'<svg viewBox="0 0 360 150" preserveAspectRatio="xMaxYMid slice"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M214 111V65l34-22 34 22v46M229 111V80h38v31M248 43V27M239 27h18"/><circle cx="307" cy="51" r="17"/><path d="M307 42v10l8 5M193 112h116"/></g></svg>',
 missions:'<svg viewBox="0 0 360 150" preserveAspectRatio="xMaxYMid slice"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="214" y="43" width="75" height="68" rx="7"/><path d="M231 34v18M272 34v18M214 63h75M230 80l8 8 16-18M305 105c11-21 23-32 42-44" stroke-dasharray="4 7"/><circle cx="348" cy="59" r="6"/></g></svg>',
 establishments:'<svg viewBox="0 0 360 150" preserveAspectRatio="xMaxYMid slice"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M210 112V63h78v49M224 63V48h50v15M232 82h12v12h-12zM254 82h12v12h-12zM246 112V97h12v15M200 112h99"/><path d="M314 48c0-12 9-21 21-21s21 9 21 21c0 16-21 37-21 37s-21-21-21-37Z"/><circle cx="335" cy="48" r="7"/></g></svg>',
 indemnities:'<svg viewBox="0 0 360 150" preserveAspectRatio="xMaxYMid slice"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="245" cy="76" r="37"/><path d="M257 57c-4-4-9-6-14-6-12 0-20 10-20 25s8 25 20 25c6 0 11-2 15-7M219 70h30M219 82h27"/><path d="M300 107V64h42v43M310 77h22M310 89h22M310 101h14"/></g></svg>'
}

function kindFor(title:string){
 const value=title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 if(value.includes('mission'))return 'missions'
 if(value.includes('etablissement'))return 'establishments'
 if(value.includes('indemnit'))return 'indemnities'
 return 'dashboard'
}

export default function HeroArtworkHydrator(){
 useEffect(()=>{
  let scheduled=false
  const hydrate=()=>{
   scheduled=false
   document.querySelectorAll<HTMLElement>('.product-hero').forEach(hero=>{
    const title=hero.querySelector('h1')?.textContent??''
    const kind=kindFor(title)
    let art=hero.querySelector<HTMLElement>('.hero-school-pattern')
    if(!art){
     art=document.createElement('div')
     art.setAttribute('aria-hidden','true')
     hero.appendChild(art)
    }
    if(art.dataset.kind!==kind){
     art.className=`hero-school-pattern hero-school-pattern-${kind}`
     art.dataset.kind=kind
     art.innerHTML=ART[kind]
    }
   })
  }
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(hydrate)}
  schedule()
  const observer=new MutationObserver(schedule)
  observer.observe(document.body,{childList:true,subtree:true,characterData:true})
  return()=>observer.disconnect()
 },[])
 return null
}
