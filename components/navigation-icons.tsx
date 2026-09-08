import type { ReactNode } from 'react'

const outline={fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
const soft={fill:'currentColor',opacity:.14}
const mid={fill:'currentColor',opacity:.28}

export type NavigationIconKey='dashboard'|'establishments'|'missions'|'indemnities'|'payroll'|'reports'|'documents'

export const NAV_ICONS:Record<NavigationIconKey,ReactNode>={
 dashboard:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M4.5 12.1 14 4.7l9.5 7.4v10.5a2.2 2.2 0 0 1-2.2 2.2H6.7a2.2 2.2 0 0 1-2.2-2.2Z"/><path {...mid} d="M11.1 24.8v-8.3h5.8v8.3Z"/><path {...outline} d="m3.4 12.6 10.6-8.3 10.6 8.3M5 11.9v10.7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V11.9M11 24.6v-8.2h6v8.2"/><path {...outline} d="M8.2 14.5h2.4M17.4 14.5h2.4"/></svg>,
 establishments:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M3.7 11.3h5.2v12.1H3.7zM19.1 11.3h5.2v12.1h-5.2zM8.9 8.4 14 5.2l5.1 3.2v15H8.9z"/><path {...mid} d="M11.6 16.5h4.8v6.9h-4.8z"/><path {...outline} d="M3.7 23.4V11.3h5.2M24.3 23.4V11.3h-5.2M8.9 23.4V8.4L14 5.2l5.1 3.2v15M2.8 23.4h22.4M11.6 23.4v-6.9h4.8v6.9"/><path {...outline} d="M5.6 14.2h1.5M5.6 17.5h1.5M20.9 14.2h1.5M20.9 17.5h1.5M11.2 11.2h1.5M15.3 11.2h1.5"/><circle cx="14" cy="7.9" r="1.05" {...outline}/><path {...outline} d="M14 5.2V2.8h4.1v2.1H14"/></svg>,
 missions:<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4.5" y="6.2" width="19" height="17.1" rx="3.5" {...soft}/><path {...outline} d="M8.2 4v4M19.8 4v4M5.3 10.2h17.4M7 6.2h14a2.4 2.4 0 0 1 2.4 2.4v12.1a2.4 2.4 0 0 1-2.4 2.4H7a2.4 2.4 0 0 1-2.4-2.4V8.6A2.4 2.4 0 0 1 7 6.2Z"/><circle cx="18.6" cy="18" r="4.2" {...mid}/><path {...outline} d="m16.7 18 1.4 1.4 2.6-3"/></svg>,
 indemnities:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M5.3 3.8h12.4l4.7 4.7v15.7H5.3z"/><path {...outline} d="M5.5 3.9h11.8l5.1 5v15.2H5.5zM17.3 3.9v5h5.1M8.6 12h6.1M8.6 15.3h5"/><circle cx="19.9" cy="19.5" r="5.1" {...mid}/><path {...outline} d="M21.5 16.7c-.6-.5-1.3-.7-2-.7-1.8 0-3 1.5-3 3.6s1.2 3.6 3 3.6c.8 0 1.5-.2 2.1-.7M16.2 18.6h4.1M16.2 20.5h3.7"/></svg>,
 payroll:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M5 4h14l4 4v16H5z"/><path {...outline} d="M5.5 4.2h13l4 4v15.5h-17zM18.5 4.2v4h4M9 12h9M9 15.5h7"/><circle cx="19.8" cy="19.2" r="4.7" {...mid}/><path {...outline} d="M21.1 16.8c-.5-.4-1.1-.6-1.8-.6-1.6 0-2.7 1.3-2.7 3s1.1 3 2.7 3c.7 0 1.3-.2 1.8-.6M16.3 18.5h3.5M16.3 20h3.2"/></svg>,
 reports:<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4.1" y="16.3" width="4.2" height="8" rx="1.2" {...mid}/><rect x="11.8" y="11.3" width="4.2" height="13" rx="1.2" {...mid}/><rect x="19.5" y="6.5" width="4.2" height="17.8" rx="1.2" {...mid}/><path {...outline} d="M4.5 24.4V17h3.4v7.4M12.2 24.4V12h3.4v12.4M19.9 24.4V7.2h3.4v17.2M3.7 24.4h21"/><path {...outline} d="M5.2 13.6c4.4-.7 8.6-2.9 12.1-6.4l4.5-4.5M18.7 2.7h3.2v3.2"/></svg>,
 documents:<svg viewBox="0 0 28 28" aria-hidden="true"><path {...soft} d="M4.7 9.2h8.1l2-2.4h8.5a2.1 2.1 0 0 1 2.1 2.1v13.4a2.1 2.1 0 0 1-2.1 2.1H4.7z"/><path {...outline} d="M4.7 9.2h8.1l2-2.4h8.5a2.1 2.1 0 0 1 2.1 2.1v13.4a2.1 2.1 0 0 1-2.1 2.1H4.7z"/><path {...mid} d="M9.4 3.4h9.5l3 3.1v7.1H9.4z"/><path {...outline} d="M9.4 3.4h9.5l3 3.1v7.1M18.9 3.4v3.2H22"/></svg>,
}
