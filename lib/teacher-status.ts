export const TEACHER_STATUS_OPTIONS = [
  { value: 'first_degree_titular_replacement', label: '1er degré · Titulaire remplaçant', shortLabel: 'Titulaire remplaçant · 1er degré' },
  { value: 'first_degree_trainee_replacement', label: '1er degré · Stagiaire remplaçant', shortLabel: 'Stagiaire remplaçant · 1er degré' },
  { value: 'first_degree_contractual', label: '1er degré · Enseignant contractuel', shortLabel: 'Contractuel · 1er degré' },
  { value: 'second_degree_tzr_titular', label: '2nd degré · TZR titulaire', shortLabel: 'TZR titulaire · 2nd degré' },
  { value: 'second_degree_tzr_trainee', label: '2nd degré · TZR stagiaire', shortLabel: 'TZR stagiaire · 2nd degré' },
  { value: 'second_degree_contractual_cdd', label: '2nd degré · Enseignant contractuel CDD', shortLabel: 'Contractuel CDD · 2nd degré' },
  { value: 'second_degree_contractual_cdi', label: '2nd degré · Enseignant contractuel CDI', shortLabel: 'Contractuel CDI · 2nd degré' },
] as const

export type TeacherStatus = typeof TEACHER_STATUS_OPTIONS[number]['value']

export function teacherStatusLabel(value: TeacherStatus | string | null | undefined, short = false) {
  if (!value) return null
  const option = TEACHER_STATUS_OPTIONS.find(item => item.value === value)
  return option ? (short ? option.shortLabel : option.label) : null
}
