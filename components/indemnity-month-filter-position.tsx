'use client'

import { useEffect } from 'react'

export default function IndemnityMonthFilterPosition(){
  useEffect(()=>{
    function placeFilter(){
      const main=document.querySelector<HTMLElement>('.indemnities-main')
      const summary=main?.querySelector<HTMLElement>('.indemnity-summary')
      const filter=main?.querySelector<HTMLElement>('.filter-box')
      if(!main||!summary||!filter)return

      let bar=main.querySelector<HTMLElement>('.indemnity-period-bar')
      if(!bar){
        bar=document.createElement('section')
        bar.className='indemnity-period-bar'
        const copy=document.createElement('div')
        copy.className='indemnity-period-copy'
        copy.innerHTML='<span>Période affichée</span><small>Les indicateurs et les journées ci-dessous correspondent à ce mois.</small>'
        bar.appendChild(copy)
        main.insertBefore(bar,summary)
      }
      if(filter.parentElement!==bar)bar.appendChild(filter)
    }

    placeFilter()
    const observer=new MutationObserver(()=>requestAnimationFrame(placeFilter))
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])
  return null
}
