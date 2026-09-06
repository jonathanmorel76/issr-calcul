'use client'

import { useEffect, useState } from 'react'
import { ProfileAvatar, ageFromBirthDate, isBirthday, useUserProfile } from '@/components/user-profile'

type Weather = {
  city: string
  temperature: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  wind_speed: number
  description: string
}

function weatherIcon(code: number) {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅️'
  if ([45,48].includes(code)) return '🌫️'
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return '🌧️'
  if ([71,73,75,77,85,86].includes(code)) return '🌨️'
  if ([95,96,99].includes(code)) return '⛈️'
  return '🌤️'
}

function teachingSince(value: string | null | undefined) {
  if (!value) return null
  const start = new Date(`${value}T12:00:00`)
  const now = new Date()
  if (Number.isNaN(start.getTime()) || start > now) return null

  let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) totalMonths -= 1
  totalMonths = Math.max(0, totalMonths)

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  let duration = ''
  if (years === 0) duration = `${totalMonths} mois`
  else if (months === 0) duration = `${years} an${years > 1 ? 's' : ''}`
  else duration = `${years} an${years > 1 ? 's' : ''} et ${months} mois`

  return `Enseigne depuis le ${start.toLocaleDateString('fr-FR')} · ${duration}`
}

export default function DashboardProfileHeader({ defaultOrigin: _defaultOrigin }: { defaultOrigin: string }) {
  const { profile, avatarUrl, loading } = useUserProfile()
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherUnavailable, setWeatherUnavailable] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherLoading(false)
      setWeatherUnavailable(true)
      return
    }
    let active = true
    const ctrl = new AbortController()
    navigator.geolocation.getCurrentPosition(
      position => {
        if (!active) return
        const { latitude, longitude } = position.coords
        fetch(`/api/weather?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`, { signal: ctrl.signal })
          .then(async response => {
            if (!response.ok) throw new Error('Météo indisponible')
            return response.json()
          })
          .then(data => { if (active) setWeather(data as Weather) })
          .catch(() => { if (active && !ctrl.signal.aborted) setWeatherUnavailable(true) })
          .finally(() => { if (active && !ctrl.signal.aborted) setWeatherLoading(false) })
      },
      error => {
        if (!active) return
        setWeatherLoading(false)
        setWeatherUnavailable(true)
        setLocationDenied(error.code === error.PERMISSION_DENIED)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    )
    return () => { active = false; ctrl.abort() }
  }, [])

  const age = ageFromBirthDate(profile?.birth_date)
  const birthday = isBirthday(profile?.birth_date)
  const name = profile?.display_name?.trim() || 'Mon profil'
  const teachingLabel = teachingSince(profile?.teaching_start_date)

  return <div className="dashboard-profile-cluster">
    <div className="dashboard-weather" aria-label="Météo selon votre position actuelle">
      {weatherLoading ? <><span className="weather-icon">…</span><div><strong>Météo</strong><small>Localisation en cours…</small></div></> : weather ? <><span className="weather-icon">{weatherIcon(weather.weather_code)}</span><div><strong>{Math.round(weather.temperature)}°C · {weather.description}</strong><small>📍 {weather.city}{weather.precipitation > 0 ? ` · ${weather.precipitation} mm` : ''}</small></div></> : <><span className="weather-icon">🌤️</span><div><strong>Météo locale</strong><small>{locationDenied ? 'Autorisez la localisation pour l’afficher' : weatherUnavailable ? 'Localisation indisponible' : 'Indisponible'}</small></div></>}
    </div>
    <div className="dashboard-profile-copy">
      {birthday && <span className="birthday-chip">🎂 Joyeux anniversaire !</span>}
      <strong>{loading ? 'Mon profil' : name}</strong>
      <small>{age !== null ? `${age} ans` : 'Âge non renseigné'}</small>
      {teachingLabel && <small>{teachingLabel}</small>}
    </div>
    <ProfileAvatar kind={profile?.avatar_kind} photoUrl={avatarUrl} size="lg" />
  </div>
}
