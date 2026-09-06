export const TEACHER_STATUS_OPTIONS = [
  { value: 'first_degree_titular_replacement', label: 'Titulaire remplaçant · 1er degré', shortLabel: 'Titulaire remplaçant · 1er degré' },
  { value: 'first_degree_trainee_replacement', label: 'Stagiaire remplaçant · 1er degré', shortLabel: 'Stagiaire remplaçant · 1er degré' },
  { value: 'first_degree_contractual', label: 'Contractuel · 1er degré', shortLabel: 'Contractuel · 1er degré' },
  { value: 'second_degree_tzr_titular', label: 'TZR titulaire · 2nd degré', shortLabel: 'TZR titulaire · 2nd degré' },
  { value: 'second_degree_tzr_trainee', label: 'TZR stagiaire · 2nd degré', shortLabel: 'TZR stagiaire · 2nd degré' },
  { value: 'second_degree_contractual_cdd', label: 'Contractuel CDD · 2nd degré', shortLabel: 'Contractuel CDD · 2nd degré' },
  { value: 'second_degree_contractual_cdi', label: 'Contractuel CDI · 2nd degré', shortLabel: 'Contractuel CDI · 2nd degré' },
] as const

export type TeacherStatus = typeof TEACHER_STATUS_OPTIONS[number]['value']

export function teacherStatusLabel(value: TeacherStatus | string | null | undefined, short = false) {
  if (!value) return null
  const option = TEACHER_STATUS_OPTIONS.find(item => item.value === value)
  return option ? (short ? option.shortLabel : option.label) : null
}
