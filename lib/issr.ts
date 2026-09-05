export type IssrBracket = { min: number; max: number; amount: number }

export type IssrRateSchedule = {
  id: string
  code: string
  title: string
  valid_from: string
  valid_to: string | null
  brackets: IssrBracket[]
  extra_20km: number | string
  source_name: string
  source_url: string
  source_nor: string | null
  source_jorf: string | null
  source_text_id: string | null
  published_at: string | null
  verified_at: string
  is_official: boolean
}

export const PRIME_REP_JOUR = 1734 / 12 / 30
export const PRIME_REPPLUS_JOUR = 5114.04 / 12 / 30

export function scheduleForDate(schedules: IssrRateSchedule[], date: string) {
  return [...schedules]
    .filter(s => date >= s.valid_from && (!s.valid_to || date <= s.valid_to))
    .sort((a,b) => b.valid_from.localeCompare(a.valid_from))[0] ?? null
}

export function calcIndemKm(km: number, schedule: IssrRateSchedule) {
  if (!Number.isFinite(km) || km < 0) return 0
  const brackets = schedule.brackets ?? []
  for (const t of brackets) if (km >= Number(t.min) && km <= Number(t.max)) return Number(t.amount)
  const last = brackets[brackets.length - 1]
  if (last && km > Number(last.max)) {
    return Number(last.amount) + Math.ceil((km - Number(last.max)) / 20) * Number(schedule.extra_20km)
  }
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
