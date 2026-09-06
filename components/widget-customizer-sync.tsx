'use client'

import { useEffect } from 'react'

const WIDGET_LABEL_BY_CLASS: Array<[string, string]> = [
  ['widget-next', 'Prochaine mission'],
  ['widget-attention', 'À vérifier'],
  ['widget-activity', 'Activité du mois'],
  ['widget-money', 'Indemnités du mois'],
  ['widget-establishments', 'Mes établissements'],
  ['widget-quick', 'Accès rapides'],
]

function syncCustomizerOrder() {
  const grid = document.querySelector('.widget-grid')
  const toggles = document.querySelector('.widget-toggles')
  if (!grid || !toggles) return

  const rows = Array.from(toggles.querySelectorAll<HTMLElement>('.widget-toggle-row'))
  if (!rows.length) return

  const rowByLabel = new Map<string, HTMLElement>()
  for (const row of rows) {
    const label = row.querySelector('label span')?.textContent?.trim()
    if (label) rowByLabel.set(label, row)
  }

  const orderedLabels: string[] = []
  for (const widget of Array.from(grid.children)) {
    if (!(widget instanceof HTMLElement)) continue
    const match = WIDGET_LABEL_BY_CLASS.find(([className]) => widget.classList.contains(className))
    if (match) orderedLabels.push(match[1])
  }

  const active = orderedLabels.map(label => rowByLabel.get(label)).filter(Boolean) as HTMLElement[]
  const inactive = rows.filter(row => !active.includes(row))
  for (const row of [...active, ...inactive]) toggles.appendChild(row)
}

export default function WidgetCustomizerSync() {
  useEffect(() => {
    let scheduled = false
    const scheduleSync = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        syncCustomizerOrder()
      })
    }

    scheduleSync()
    const observer = new MutationObserver(scheduleSync)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', scheduleSync, true)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', scheduleSync, true)
    }
  }, [])

  return null
}
