import { NextRequest, NextResponse } from 'next/server'

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: 'Ciel dégagé', 1: 'Peu nuageux', 2: 'Partiellement nuageux', 3: 'Couvert', 45: 'Brouillard', 48: 'Brouillard givrant',
  51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte', 56: 'Bruine verglaçante', 57: 'Bruine verglaçante', 61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte', 66: 'Pluie verglaçante', 67: 'Pluie verglaçante',
  71: 'Neige légère', 73: 'Neige', 75: 'Neige forte', 77: 'Grains de neige', 80: 'Averses légères', 81: 'Averses', 82: 'Fortes averses', 85: 'Averses de neige', 86: 'Fortes averses de neige', 95: 'Orage', 96: 'Orage avec grêle', 99: 'Orage avec forte grêle',
}

function validCoordinate(value: string | null, min: number, max: number) {
  if (value === null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null
}

export async function GET(request: NextRequest) {
  const latitude = validCoordinate(request.nextUrl.searchParams.get('latitude'), -90, 90)
  const longitude = validCoordinate(request.nextUrl.searchParams.get('longitude'), -180, 180)
  if (latitude === null || longitude === null) return NextResponse.json({ error: 'Coordonnées manquantes ou invalides' }, { status: 400 })

  try {
    let city = 'Votre position'
    try {
      const reverse = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lat=${latitude}&lon=${longitude}&limit=1`, { next: { revalidate: 3600 } })
      if (reverse.ok) {
        const geo = await reverse.json()
        const feature = geo.features?.[0]
        city = feature?.properties?.city || feature?.properties?.municipality || feature?.properties?.label || city
      }
    } catch {}

    const weatherUrl = new URL('https://api.open-meteo.com/v1/meteofrance')
    weatherUrl.searchParams.set('latitude', String(latitude))
    weatherUrl.searchParams.set('longitude', String(longitude))
    weatherUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m')
    weatherUrl.searchParams.set('timezone', 'auto')

    const weatherResponse = await fetch(weatherUrl, { next: { revalidate: 600 } })
    if (!weatherResponse.ok) throw new Error('Météo indisponible')
    const weather = await weatherResponse.json()
    const current = weather.current
    if (!current) throw new Error('Météo indisponible')
    const code = Number(current.weather_code ?? -1)

    return NextResponse.json({
      city,
      temperature: Number(current.temperature_2m ?? 0),
      apparent_temperature: Number(current.apparent_temperature ?? 0),
      precipitation: Number(current.precipitation ?? 0),
      weather_code: code,
      wind_speed: Number(current.wind_speed_10m ?? 0),
      description: WEATHER_DESCRIPTIONS[code] ?? 'Conditions variables',
      source: 'Open-Meteo · modèles Météo-France AROME/ARPEGE',
    }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } })
  } catch {
    return NextResponse.json({ error: 'Météo indisponible' }, { status: 502 })
  }
}
