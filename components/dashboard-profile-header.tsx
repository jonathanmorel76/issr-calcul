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

export default function DashboardProfileHeader({ defaultOrigin }: { defaultOrigin: string }) {
  const { profile, avatarUrl, loading } = useUserProfile()
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherUnavailable, setWeatherUnavailable] = useState(false)

  useEffect(() => {
    if (!defaultOrigin.trim()) {
      setWeather(null)
      setWeatherUnavailable(true)
      return
    }
    const ctrl = new AbortController()
    setWeatherLoading(true)
    setWeatherUnavailable(false)
    fetch(`/api/weather?address=${encodeURIComponent(defaultOrigin.trim())}`, { signal: ctrl.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Météo indisponible')
        return response.json()
      })
      .then(data => setWeather(data as Weather))
      .catch(() => { if (!ctrl.signal.aborted) setWeatherUnavailable(true) })
      .finally(() => { if (!ctrl.signal.aborted) setWeatherLoading(false) })
    return () => ctrl.abort()
  }, [defaultOrigin])

  const age = ageFromBirthDate(profile?.birth_date)
  const birthday = isBirthday(profile?.birth_date)
  const name = profile?.display_name?.trim() || 'Mon profil'

  return <div className="dashboard-profile-cluster">
    <div className="dashboard-weather" aria-label="Météo locale">
      {weatherLoading ? <><span className="weather-icon">…</span><div><strong>Météo</strong><small>Actualisation…</small></div></> : weather ? <><span className="weather-icon">{weatherIcon(weather.weather_code)}</span><div><strong>{Math.round(weather.temperature)}°C · {weather.description}</strong><small>{weather.city}{weather.precipitation > 0 ? ` · ${weather.precipitation} mm` : ''}</small></div></> : <><span className="weather-icon">🌤️</span><div><strong>Météo</strong><small>{weatherUnavailable ? 'Adresse habituelle à renseigner' : 'Indisponible'}</small></div></>}
    </div>
    <div className="dashboard-profile-copy">
      {birthday && <span className="birthday-chip">🎂 Joyeux anniversaire !</span>}
      <strong>{loading ? 'Mon profil' : name}</strong>
      <small>{age !== null ? `${age} ans` : 'Âge non renseigné'}</small>
    </div>
    <ProfileAvatar kind={profile?.avatar_kind} photoUrl={avatarUrl} size="lg" />
  </div>
}
