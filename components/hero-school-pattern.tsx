type HeroKind='dashboard'|'establishments'|'missions'|'indemnities'|'bilans'|'documents'

export default function HeroSchoolPattern({kind}:{kind:HeroKind}){
 return <div className={`hero-school-pattern hero-school-pattern-${kind}`} aria-hidden="true">
  <svg viewBox="0 0 360 150" preserveAspectRatio="xMaxYMid slice">
   <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    {kind==='dashboard'&&<><path d="M214 111V65l34-22 34 22v46M229 111V80h38v31M248 43V27M239 27h18"/><circle cx="307" cy="51" r="17"/><path d="M307 42v10l8 5M193 112h116"/></>}
    {kind==='establishments'&&<><path d="M210 112V63h78v49M224 63V48h50v15M232 82h12v12h-12zM254 82h12v12h-12zM246 112V97h12v15M200 112h99"/><path d="M314 48c0-12 9-21 21-21s21 9 21 21c0 16-21 37-21 37s-21-21-21-37Z"/><circle cx="335" cy="48" r="7"/></>}
    {kind==='missions'&&<><rect x="214" y="43" width="75" height="68" rx="7"/><path d="M231 34v18M272 34v18M214 63h75M230 80l8 8 16-18M305 105c11-21 23-32 42-44" strokeDasharray="4 7"/><circle cx="348" cy="59" r="6"/></>}
    {kind==='indemnities'&&<><circle cx="245" cy="76" r="37"/><path d="M257 57c-4-4-9-6-14-6-12 0-20 10-20 25s8 25 20 25c6 0 11-2 15-7M219 70h30M219 82h27"/><path d="M300 107V64h42v43M310 77h22M310 89h22M310 101h14"/></>}
    {kind==='bilans'&&<><path d="M210 111V52h74v59M225 94V78M244 94V65M263 94V56M218 101h58"/><path d="M303 99l13-18 12 8 22-31M341 58h9v9"/></>}
    {kind==='documents'&&<><path d="M222 35h54l18 18v60h-72zM276 35v20h18M237 72h42M237 85h42M237 98h27"/><path d="M311 55h28v57h-28M319 70h12M319 82h12M319 94h12"/></>}
   </g>
  </svg>
 </div>
}
