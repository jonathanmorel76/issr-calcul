'use client'

import { useEffect } from 'react'

const PREMIUM_SELECTORS=[
 '.premium-entry-link',
 '.btn-premium',
 '.beta-premium-badge',
 '.premium-inline-lock',
 '.premium-locked-panel .tag',
 '.beta-payment-overview.free .beta-payment-overview-lock',
 '.beta-operational-insights.free .beta-operational-lock',
].join(',')

function openSubscriptionMenu(){
 const trigger=document.querySelector<HTMLButtonElement>('.beta-mode-pill')
 if(trigger){trigger.click();return}
 window.setTimeout(()=>document.querySelector<HTMLButtonElement>('.beta-mode-pill')?.click(),80)
}

export default function PremiumSubscriptionRouter(){
 useEffect(()=>{
  const onOpen=()=>openSubscriptionMenu()
  const onClick=(event:MouseEvent)=>{
   const target=event.target as HTMLElement|null
   if(!target)return
   const premiumTarget=target.closest<HTMLElement>(PREMIUM_SELECTORS)
   if(!premiumTarget)return
   const tag=premiumTarget.matches('.tag')
   if(tag&&!/premium/i.test(premiumTarget.textContent??''))return
   event.preventDefault()
   event.stopPropagation()
   openSubscriptionMenu()
  }
  window.addEventListener('mr-open-premium-subscription',onOpen as EventListener)
  document.addEventListener('click',onClick,true)
  return()=>{
   window.removeEventListener('mr-open-premium-subscription',onOpen as EventListener)
   document.removeEventListener('click',onClick,true)
  }
 },[])
 return null
}
