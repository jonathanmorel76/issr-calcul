'use client'

import type { CSSProperties, ReactNode } from 'react'

export type AppIconName=
 |'home'|'building'|'mission'|'coins'|'chart'|'file'|'rates'|'sources'|'calculator'|'account'
 |'weather-sun'|'weather-cloud'|'weather-rain'|'weather-snow'|'weather-fog'|'weather-storm'
 |'location'|'birthday'|'teacher-male'|'teacher-female'|'alert'|'info'|'calendar'|'map'
 |'settings'|'download'|'search'|'filter'|'trash'|'edit'|'check'|'clock'|'distance'|'menu'
 |'arrow-left'|'arrow-right'|'close'

type Props={name:AppIconName;size?:number;className?:string;style?:CSSProperties;title?:string}

const common={fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}

export default function AppIcon({name,size=20,className='',style,title}:Props){
 const a11y=title?{role:'img','aria-label':title}:{'aria-hidden':true as const}
 const paths:Record<AppIconName,ReactNode>={
  home:<><path {...common} d="M3 11.5 12 4l9 7.5"/><path {...common} d="M5.5 10.5V20h13v-9.5M9.3 20v-5.6h5.4V20"/></>,
  building:<><path {...common} d="M5 20V8.5L12 5l7 3.5V20"/><path {...common} d="M3.5 20h17M8 11h1M8 14.5h1M15 11h1M15 14.5h1M10 20v-3h4v3"/><path {...common} d="M10.5 5V3.5h3V5"/></>,
  mission:<><rect {...common} x="5" y="5.5" width="14" height="15" rx="2"/><path {...common} d="M9 5.5V3.8h6v1.7M8.5 10.5l1.7 1.7 3.2-3.3M8.5 15.5l1.7 1.7 3.2-3.3M14.8 11h1.8M14.8 16h1.8"/></>,
  coins:<><ellipse {...common} cx="9" cy="8" rx="5" ry="2.5"/><path {...common} d="M4 8v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8M4 12v3.8c0 1.4 2.2 2.5 5 2.5 1.2 0 2.3-.2 3.2-.5"/><ellipse {...common} cx="16.5" cy="13.5" rx="3.5" ry="2"/><path {...common} d="M13 13.5v4c0 1.1 1.6 2 3.5 2s3.5-.9 3.5-2v-4"/></>,
  chart:<><path {...common} d="M4 20V10h4v10M10 20V5h4v15M16 20V8h4v12"/></>,
  file:<><path {...common} d="M6 3.5h8l4 4V20H6z"/><path {...common} d="M14 3.5v4h4M9 12h6M9 15h6"/></>,
  rates:<><path {...common} d="M5 4h14v16H5zM8 8h8M8 12h2M12 12h4M8 16h2M12 16h4"/></>,
  sources:<><path {...common} d="M5 5.5c2-.9 4-.9 6 0v14c-2-.9-4-.9-6 0zM19 5.5c-2-.9-4-.9-6 0v14c2-.9 4-.9 6 0z"/><path {...common} d="M12 5.5v14"/></>,
  calculator:<><rect {...common} x="5" y="3.5" width="14" height="17" rx="2"/><path {...common} d="M8 7h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h5"/></>,
  account:<><circle {...common} cx="12" cy="8" r="3.2"/><path {...common} d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></>,
  'weather-sun':<><circle {...common} cx="12" cy="12" r="4"/><path {...common} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></>,
  'weather-cloud':<><path {...common} d="M6.5 18.5h10.8a3.7 3.7 0 0 0 .5-7.4A5.8 5.8 0 0 0 6.6 9.6 4.5 4.5 0 0 0 6.5 18.5Z"/><path {...common} d="M6.7 7.1A4.2 4.2 0 0 1 13 4.2"/></>,
  'weather-rain':<><path {...common} d="M6.5 15.5h10.8a3.7 3.7 0 0 0 .5-7.4A5.8 5.8 0 0 0 6.6 6.6a4.5 4.5 0 0 0-.1 8.9Z"/><path {...common} d="M8 18.5l-1 2M13 18.5l-1 2M18 18.5l-1 2"/></>,
  'weather-snow':<><path {...common} d="M6.5 14.5h10.8a3.7 3.7 0 0 0 .5-7.4A5.8 5.8 0 0 0 6.6 5.6a4.5 4.5 0 0 0-.1 8.9Z"/><path {...common} d="M8 18h.01M12 20h.01M16 18h.01"/></>,
  'weather-fog':<><path {...common} d="M5 8.5h14M3.5 12h17M5 15.5h14M7 19h10"/></>,
  'weather-storm':<><path {...common} d="M6.5 14.5h10.8a3.7 3.7 0 0 0 .5-7.4A5.8 5.8 0 0 0 6.6 5.6a4.5 4.5 0 0 0-.1 8.9Z"/><path {...common} d="m12.5 15.8-2 3h2l-1 2.7 4-4.4h-2l1-1.3"/></>,
  location:<><path {...common} d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle {...common} cx="12" cy="10" r="2.2"/></>,
  birthday:<><path {...common} d="M5 10h14v10H5zM4 10h16M12 5v5M8 7.5V10M16 7.5V10"/><path {...common} d="M12 5c-1-1.1-.6-2.2.1-3 .9.8 1.3 1.9-.1 3ZM8 7.5c-.8-.8-.5-1.7.1-2.3.7.6 1 1.5-.1 2.3ZM16 7.5c-.8-.8-.5-1.7.1-2.3.7.6 1 1.5-.1 2.3Z"/></>,
  'teacher-male':<><circle {...common} cx="12" cy="7.5" r="3"/><path {...common} d="M6.5 20v-3.8c0-3.1 2.3-5.2 5.5-5.2s5.5 2.1 5.5 5.2V20M9 20v-4M15 20v-4"/><path {...common} d="M4 8V4h4M16 4h4v7h-3"/></>,
  'teacher-female':<><circle {...common} cx="12" cy="7.5" r="3"/><path {...common} d="M6.5 20v-3.8c0-3.1 2.3-5.2 5.5-5.2s5.5 2.1 5.5 5.2V20M9 20v-4M15 20v-4"/><path {...common} d="M8.7 6c.5-2.4 2-3.6 3.6-3.6 1.8 0 3.4 1.5 3.8 4M4 8V4h4M16 4h4v7h-3"/></>,
  alert:<><path {...common} d="M12 3 2.8 20h18.4Z"/><path {...common} d="M12 9v5M12 17h.01"/></>,
  info:<><circle {...common} cx="12" cy="12" r="9"/><path {...common} d="M12 10v6M12 7h.01"/></>,
  calendar:<><rect {...common} x="4" y="5.5" width="16" height="14" rx="2"/><path {...common} d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h3M13 13h3M8 16h3"/></>,
  map:<><path {...common} d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2zM9 3v16M15 5v16"/></>,
  settings:<><circle {...common} cx="12" cy="12" r="3"/><path {...common} d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4"/></>,
  download:<><path {...common} d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14"/></>,
  search:<><circle {...common} cx="10.5" cy="10.5" r="6.5"/><path {...common} d="m15.5 15.5 5 5"/></>,
  filter:<><path {...common} d="M4 6h16M7 12h10M10 18h4"/></>,
  trash:<><path {...common} d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10.5v6M14 10.5v6"/></>,
  edit:<><path {...common} d="m5 17-.8 3.8L8 20l10.2-10.2-3-3Z"/><path {...common} d="m13.8 8.2 3 3"/></>,
  check:<><circle {...common} cx="12" cy="12" r="9"/><path {...common} d="m8 12 2.6 2.6L16.5 9"/></>,
  clock:<><circle {...common} cx="12" cy="12" r="9"/><path {...common} d="M12 7v5l3.5 2"/></>,
  distance:<><circle {...common} cx="5" cy="12" r="2"/><circle {...common} cx="19" cy="12" r="2"/><path {...common} d="M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3"/></>,
  menu:<><path {...common} d="M4 7h16M4 12h16M4 17h16"/></>,
  'arrow-left':<><path {...common} d="M19 12H5M10 7l-5 5 5 5"/></>,
  'arrow-right':<><path {...common} d="M5 12h14M14 7l5 5-5 5"/></>,
  close:<><path {...common} d="M6 6l12 12M18 6 6 18"/></>,
 }
 return <svg {...a11y} className={`app-icon ${className}`.trim()} style={style} width={size} height={size} viewBox="0 0 24 24" focusable="false">{paths[name]}</svg>
}
