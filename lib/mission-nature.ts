export const MISSION_NATURE_OPTIONS = [
  { value: 'teacher_absence', label: 'Enseignant absent', shortLabel: 'Enseignant absent' },
  { value: 'headteacher_release', label: 'Décharge de direction', shortLabel: 'Décharge de direction' },
  { value: 'part_time_complement', label: 'Complément temps partiel', shortLabel: 'Complément temps partiel' },
  { value: 'trainer_release', label: 'Décharge maître formateur', shortLabel: 'Décharge maître formateur' },
  { value: 'training_or_support_release', label: 'Formation / support', shortLabel: 'Formation / support' },
  { value: 'annual_fractionated_service', label: 'Service fractionné / année', shortLabel: 'Service fractionné' },
  { value: 'other', label: 'Autre situation', shortLabel: 'Autre' },
] as const

export type MissionNature = typeof MISSION_NATURE_OPTIONS[number]['value']

export function missionNatureLabel(value: MissionNature | string | null | undefined, short = false) {
  if (!value) return null
  const option = MISSION_NATURE_OPTIONS.find(item => item.value === value)
  return option ? (short ? option.shortLabel : option.label) : null
}
