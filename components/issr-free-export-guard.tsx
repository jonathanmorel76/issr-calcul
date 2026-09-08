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
        button.disabled=isFree
        button.setAttribute('aria-disabled',String(isFree))
        button.dataset.issrExportLocked=isFree?'1':'0'
      })

      let note=tools.querySelector<HTMLButtonElement>('.issr-export-lock-note')
      if(isFree){
        if(!note){
          note=document.createElement('button')
          note.type='button'
          note.className='issr-export-lock-note premium-trigger'
          note.innerHTML='<span class="premium-badge">PRO</span><span><strong>Exporter mes journées</strong><small>Excel et PDF sont disponibles avec le mode Pro.</small></span>'
          tools.appendChild(note)
        }
      }else if(note){
        note.remove()
      }
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
    }
    document.addEventListener('click',onCapture,true)
    return()=>document.removeEventListener('click',onCapture,true)
  },[mode])

  return null
}
