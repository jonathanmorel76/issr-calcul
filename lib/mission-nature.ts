export const MISSION_NATURE_OPTIONS = [
  { value: 'teacher_absence', label: 'Remplacement d’un enseignant absent', shortLabel: 'Enseignant absent' },
  { value: 'headteacher_release', label: 'Décharge de direction', shortLabel: 'Décharge de direction' },
  { value: 'part_time_complement', label: 'Complément de temps partiel', shortLabel: 'Complément de temps partiel' },
  { value: 'trainer_release', label: 'Décharge de maître formateur', shortLabel: 'Décharge de maître formateur' },
  { value: 'training_or_support_release', label: 'Formation ou libération ponctuelle de support', shortLabel: 'Formation / support' },
  { value: 'annual_fractionated_service', label: 'Affectation à l’année ou service fractionné', shortLabel: 'Service fractionné' },
  { value: 'other', label: 'Autre situation de remplacement', shortLabel: 'Autre' },
] as const

export type MissionNature = typeof MISSION_NATURE_OPTIONS[number]['value']

export function missionNatureLabel(value: MissionNature | string | null | undefined, short = false) {
  if (!value) return null
  const option = MISSION_NATURE_OPTIONS.find(item => item.value === value)
  return option ? (short ? option.shortLabel : option.label) : null
}
