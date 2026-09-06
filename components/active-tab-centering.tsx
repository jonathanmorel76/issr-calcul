'use client'

import { useEffect } from 'react'

export default function ActiveTabCentering(){
 useEffect(()=>{
  function centerActive(){
   document.querySelectorAll<HTMLElement>('.product-tabs').forEach(nav=>{
    const active=nav.querySelector<HTMLElement>('button.active')
    if(!active)return
    const target=active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2
    nav.scrollTo({left:Math.max(0,target),behavior:'smooth'})
   })
  }
  const observer=new MutationObserver(records=>{
   if(records.some(r=>r.type==='attributes'&&r.attributeName==='class'))requestAnimationFrame(centerActive)
  })
  document.querySelectorAll('.product-tabs').forEach(nav=>observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']}))
  requestAnimationFrame(centerActive)
  window.addEventListener('resize',centerActive)
  return()=>{observer.disconnect();window.removeEventListener('resize',centerActive)}
 },[])
 return null
}
