'use client'

import { useEffect } from 'react'

function formatRangeText(text: string) {
  const match = text.trim().match(/^(-?\d+(?:[.,]\d+)?)\s+à\s+(-?\d+(?:[.,]\d+)?)\s+km$/i)
  if (!match) return text

  const min = Number(match[1].replace(',', '.'))
  const max = Number(match[2].replace(',', '.'))
  if (!Number.isFinite(min) || !Number.isFinite(max)) return text

  const displayMin = Number.isInteger(min) ? String(min) : min.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  const displayMax = max > 80 || Number.isInteger(max)
    ? String(max)
    : Math.floor(max * 10) / 10 < max
      ? (Math.floor(max * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : max.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

  return `${displayMin} à ${displayMax} km`
}

export default function RateRangeDisplayFix() {
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll<HTMLElement>('.rate-grid > div > span').forEach((element) => {
        const formatted = formatRangeText(element.textContent ?? '')
        if (formatted !== element.textContent) element.textContent = formatted
      })
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
