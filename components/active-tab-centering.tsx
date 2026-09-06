'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ActiveTabCentering(){
 const pathname=usePathname()

 useEffect(()=>{
  let frame=0

  function centerActive(behavior:ScrollBehavior='smooth'){
   document.querySelectorAll<HTMLElement>('.product-tabs').forEach(nav=>{
    const active=nav.querySelector<HTMLElement>('.active')
    if(!active)return
    const maxLeft=Math.max(0,nav.scrollWidth-nav.clientWidth)
    const target=Math.min(maxLeft,Math.max(0,active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2))
    nav.scrollTo({left:target,behavior})
   })
  }

  function scheduleCenter(behavior:ScrollBehavior='smooth'){
   cancelAnimationFrame(frame)
   frame=requestAnimationFrame(()=>centerActive(behavior))
  }

  const observer=new MutationObserver(records=>{
   if(records.some(record=>record.type==='childList'||(record.type==='attributes'&&record.attributeName==='class'))){
    scheduleCenter('smooth')
   }
  })
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})

  const onClick=(event:MouseEvent)=>{
   const target=event.target as Element|null
   if(target?.closest('.product-tabs button,.product-tabs a')){
    window.setTimeout(()=>scheduleCenter('smooth'),0)
   }
  }
  const onResize=()=>scheduleCenter('auto')

  document.addEventListener('click',onClick,true)
  window.addEventListener('resize',onResize)
  scheduleCenter('auto')
  const delayed=window.setTimeout(()=>scheduleCenter('auto'),120)

  return()=>{
   cancelAnimationFrame(frame)
   window.clearTimeout(delayed)
   observer.disconnect()
   document.removeEventListener('click',onClick,true)
   window.removeEventListener('resize',onResize)
  }
 },[pathname])

 return null
}
