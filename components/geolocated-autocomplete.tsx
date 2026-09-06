'use client'

import { useEffect } from 'react'

type Geo={lat:number;lon:number}|null
type School={id:string;name:string;type:string;status:string;address:string;city:string;postalCode:string;distanceKm:number|null}
type Address={id:string;label:string;name:string;city:string;postcode:string;context:string}

function setReactInputValue(input:HTMLInputElement,value:string,{suppressAutocomplete=false}:{suppressAutocomplete?:boolean}={}){
  if(suppressAutocomplete)input.dataset.geoSuppressOnce='1'
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set
  setter?.call(input,value)
  input.dispatchEvent(new Event('input',{bubbles:true}))
  input.dispatchEvent(new Event('change',{bubbles:true}))
}

function consumeSuppression(input:HTMLInputElement){
  if(input.dataset.geoSuppressOnce==='1'){
    delete input.dataset.geoSuppressOnce
    return true
  }
  return false
}

function labelText(input:HTMLInputElement){
  const label=input.closest('label')
  if(!label)return ''
  return Array.from(label.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent??'').join(' ').trim()
}

function ensureHost(input:HTMLInputElement){
  let host=input.parentElement?.querySelector<HTMLElement>(':scope > .geo-autocomplete-host')
  if(host)return host
  host=document.createElement('div')
  host.className='geo-autocomplete-host'
  input.insertAdjacentElement('afterend',host)
  return host
}

function removeHost(input:HTMLInputElement){
  const host=input.parentElement?.querySelector<HTMLElement>(':scope > .geo-autocomplete-host')
  host?.remove()
}

function closeHost(host:HTMLElement){host.innerHTML='';host.classList.remove('open')}
function showLoading(host:HTMLElement){host.innerHTML='<div class="geo-autocomplete-state">Recherche…</div>';host.classList.add('open')}
function showEmpty(host:HTMLElement){host.innerHTML='<div class="geo-autocomplete-state">Aucune suggestion trouvée</div>';host.classList.add('open')}

function renderSchools(host:HTMLElement,items:School[],onPick:(school:School)=>void){
  host.innerHTML=''
  if(!items.length){showEmpty(host);return}
  const head=document.createElement('div');head.className='geo-autocomplete-heading';head.textContent='Établissements scolaires';host.appendChild(head)
  items.forEach(item=>{
    const b=document.createElement('button');b.type='button';b.className='geo-autocomplete-option'
    const distance=item.distanceKm==null?'':`<span class="geo-distance">${item.distanceKm<10?item.distanceKm.toFixed(1):Math.round(item.distanceKm)} km</span>`
    b.innerHTML=`<span class="geo-option-main"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml([item.type,item.city].filter(Boolean).join(' · '))}</small><small>${escapeHtml(item.address)}</small></span>${distance}`
    b.addEventListener('mousedown',e=>{e.preventDefault();onPick(item)})
    host.appendChild(b)
  })
  host.classList.add('open')
}

function renderAddresses(host:HTMLElement,items:Address[],onPick:(address:Address)=>void){
  host.innerHTML=''
  if(!items.length){showEmpty(host);return}
  const head=document.createElement('div');head.className='geo-autocomplete-heading';head.textContent='Adresses';host.appendChild(head)
  items.forEach(item=>{
    const b=document.createElement('button');b.type='button';b.className='geo-autocomplete-option'
    b.innerHTML=`<span class="geo-option-main"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.context)}</small></span>`
    b.addEventListener('mousedown',e=>{e.preventDefault();onPick(item)})
    host.appendChild(b)
  })
  host.classList.add('open')
}

function escapeHtml(value:string){return value.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]??c))}

function isSchoolNameField(input:HTMLInputElement,label:string){
  const placeholder=(input.getAttribute('placeholder')??'').toLowerCase()
  return label==='Nom' && (placeholder.includes('école')||placeholder.includes('ecole')||placeholder.includes('collège')||placeholder.includes('college')||placeholder.includes('lycée')||placeholder.includes('lycee'))
}

function isAttachmentField(input:HTMLInputElement,label:string){
  return label==='Établissement de rattachement administratif'
}

function isAddressField(input:HTMLInputElement,label:string){
  const placeholder=(input.getAttribute('placeholder')??'').toLowerCase()
  return label==='Adresse' && (placeholder.includes('adresse')||placeholder==='')
}

export default function GeolocatedAutocomplete(){
  useEffect(()=>{
    let geo:Geo=null
    let destroyed=false
    if('geolocation' in navigator){
      navigator.geolocation.getCurrentPosition(
        p=>{geo={lat:p.coords.latitude,lon:p.coords.longitude}},
        ()=>{},
        {enableHighAccuracy:false,timeout:7000,maximumAge:10*60*1000}
      )
    }

    const cleanups=new Map<HTMLInputElement,()=>void>()

    function bindSchool(input:HTMLInputElement,mode:'name'|'attachment'='name'){
      if(input.dataset.geoSchoolBound)return
      input.dataset.geoSchoolBound='1';input.autocomplete='off'
      const host=ensureHost(input)
      let timer:number|undefined,ctrl:AbortController|null=null
      const onInput=()=>{
        if(consumeSuppression(input)){closeHost(host);return}
        window.clearTimeout(timer);ctrl?.abort();const q=input.value.trim()
        if(q.length<2){closeHost(host);return}
        timer=window.setTimeout(async()=>{
          ctrl=new AbortController();showLoading(host)
          const params=new URLSearchParams({q});if(geo){params.set('lat',String(geo.lat));params.set('lon',String(geo.lon))}
          try{const res=await fetch(`/api/schools/search?${params}`,{signal:ctrl.signal});const json=await res.json();if(destroyed)return;renderSchools(host,json.results??[],school=>{
            if(mode==='attachment'){
              setReactInputValue(input,school.address||school.name,{suppressAutocomplete:true})
            }else{
              setReactInputValue(input,school.name,{suppressAutocomplete:true})
              const form=input.closest('.mr-form')
              const addressInput=form?Array.from(form.querySelectorAll<HTMLInputElement>('input')).find(i=>isAddressField(i,labelText(i))):null
              if(addressInput&&school.address){
                const addressHost=addressInput.parentElement?.querySelector<HTMLElement>(':scope > .geo-autocomplete-host')
                if(addressHost)closeHost(addressHost)
                setReactInputValue(addressInput,school.address,{suppressAutocomplete:true})
              }
            }
            closeHost(host)
          })}catch(e){if((e as Error).name!=='AbortError')closeHost(host)}
        },220)
      }
      const onFocus=()=>{if(input.value.trim().length>=2)onInput()}
      const onBlur=()=>window.setTimeout(()=>closeHost(host),120)
      input.addEventListener('input',onInput);input.addEventListener('focus',onFocus);input.addEventListener('blur',onBlur)
      cleanups.set(input,()=>{window.clearTimeout(timer);ctrl?.abort();input.removeEventListener('input',onInput);input.removeEventListener('focus',onFocus);input.removeEventListener('blur',onBlur)})
    }

    function bindAddress(input:HTMLInputElement){
      if(input.dataset.geoAddressBound)return
      input.dataset.geoAddressBound='1';input.autocomplete='street-address'
      const host=ensureHost(input)
      let timer:number|undefined,ctrl:AbortController|null=null
      const onInput=()=>{
        if(consumeSuppression(input)){closeHost(host);return}
        window.clearTimeout(timer);ctrl?.abort();const q=input.value.trim()
        if(q.length<3){closeHost(host);return}
        timer=window.setTimeout(async()=>{
          ctrl=new AbortController();showLoading(host)
          const params=new URLSearchParams({q});if(geo){params.set('lat',String(geo.lat));params.set('lon',String(geo.lon))}
          try{const res=await fetch(`/api/addresses/search?${params}`,{signal:ctrl.signal});const json=await res.json();if(destroyed)return;renderAddresses(host,json.results??[],address=>{setReactInputValue(input,address.label,{suppressAutocomplete:true});closeHost(host)})}catch(e){if((e as Error).name!=='AbortError')closeHost(host)}
        },220)
      }
      const onFocus=()=>{if(input.value.trim().length>=3)onInput()}
      const onBlur=()=>window.setTimeout(()=>closeHost(host),120)
      input.addEventListener('input',onInput);input.addEventListener('focus',onFocus);input.addEventListener('blur',onBlur)
      cleanups.set(input,()=>{window.clearTimeout(timer);ctrl?.abort();input.removeEventListener('input',onInput);input.removeEventListener('focus',onFocus);input.removeEventListener('blur',onBlur)})
    }

    function scan(){
      const inputs=Array.from(document.querySelectorAll<HTMLInputElement>('.mr-form input'))
      for(const input of inputs){
        const label=labelText(input)
        const schoolName=isSchoolNameField(input,label)
        const attachment=isAttachmentField(input,label)
        const address=isAddressField(input,label)

        if(schoolName)bindSchool(input,'name')
        else if(attachment)bindSchool(input,'attachment')
        else if(address)bindAddress(input)
        else {
          removeHost(input)
          input.autocomplete='off'
        }
      }
    }

    scan()
    const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true})
    return()=>{destroyed=true;observer.disconnect();cleanups.forEach(fn=>fn());cleanups.clear()}
  },[])
  return null
}
