'use client'

import { useEffect } from 'react'
import useBetaProductMode from './use-beta-product-mode'

export default function IssrFreeExportGuard(){
  const mode=useBetaProductMode()

  useEffect(()=>{
    const sync=()=>{
      const section=document.querySelector<HTMLElement>('.indemnity-list')
      if(!section)return
      const tools=section.querySelector<HTMLElement>('.table-tools')
      if(!tools)return

      const exportButtons=Array.from(tools.querySelectorAll<HTMLButtonElement>('.btn-export'))
      const isFree=mode!=='premium'

      exportButtons.forEach(button=>{
        button.disabled=false
        button.setAttribute('aria-disabled',String(isFree))
        button.dataset.issrExportLocked=isFree?'1':'0'
      })

      tools.querySelector('.issr-export-lock-note')?.remove()
    }

    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.body,{subtree:true,childList:true})
    window.addEventListener('mr-beta-product-mode',sync)
    return()=>{
      observer.disconnect()
      window.removeEventListener('mr-beta-product-mode',sync)
    }
  },[mode])

  useEffect(()=>{
    const onCapture=(event:Event)=>{
      if(mode==='premium')return
      const target=event.target as Element|null
      const button=target?.closest?.('.indemnity-list .btn-export')
      if(!button)return
      event.preventDefault()
      event.stopPropagation()
      window.dispatchEvent(new Event('mr-open-premium'))
    }
    document.addEventListener('click',onCapture,true)
    return()=>document.removeEventListener('click',onCapture,true)
  },[mode])

  return null
}
