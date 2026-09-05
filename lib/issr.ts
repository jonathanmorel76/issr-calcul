export const GRILLE = [
  { min: 0, max: 9, montant: 15.94 },
  { min: 10, max: 19, montant: 21.04 },
  { min: 20, max: 29, montant: 26.16 },
  { min: 30, max: 39, montant: 30.87 },
  { min: 40, max: 49, montant: 36.86 },
  { min: 50, max: 59, montant: 42.89 },
  { min: 60, max: 80, montant: 49.24 },
]
export const SUPPL_20KM = 7.34
export const PRIME_REP_JOUR = 1734 / 12 / 30
export const PRIME_REPPLUS_JOUR = 5114.04 / 12 / 30

export function calcIndemKm(km: number) {
  if (!Number.isFinite(km) || km < 0) return 0
  for (const t of GRILLE) if (km >= t.min && km <= t.max) return t.montant
  if (km > 80) return 49.24 + Math.ceil((km - 80) / 20) * SUPPL_20KM
  return 0
}

export function fmtEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
