import { NextRequest, NextResponse } from 'next/server'

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: 'Ciel dégagé',
  1: 'Peu nuageux',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brouillard',
  48: 'Brouillard givrant',
  51: 'Bruine légère',
  53: 'Bruine',
  55: 'Bruine forte',
  56: 'Bruine verglaçante',
  57: 'Bruine verglaçante',
  61: 'Pluie légère',
  63: 'Pluie',
  65: 'Pluie forte',
  66: 'Pluie verglaçante',
  67: 'Pluie verglaçante',
  71: 'Neige légère',
  73: 'Neige',
  75: 'Neige forte',
  77: 'Grains de neige',
  80: 'Averses légères',
  81: 'Averses',
  82: 'Fortes averses',
  85: 'Averses de neige',
  86: 'Fortes averses de neige',
  95: 'Orage',
  96: 'Orage avec grêle',
  99: 'Orage avec forte grêle',
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.trim()
  if (!address) return NextResponse.json({ error: 'Adresse manquante' }, { status: 400 })

  try {
    const geocode = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`, { next: { revalidate: 86400 } })
    if (!geocode.ok) throw new Error('Géocodage indisponible')
    const geo = await geocode.json()
    const feature = geo.features?.[0]
    if (!feature) return NextResponse.json({ error: 'Adresse introuvable' }, { status: 404 })
    const [longitude, latitude] = feature.geometry.coordinates as [number, number]
    const city = feature.properties?.city || feature.properties?.municipality || feature.properties?.label || 'Votre secteur'

    const weatherUrl = new URL('https://api.open-meteo.com/v1/meteofrance')
    weatherUrl.searchParams.set('latitude', String(latitude))
    weatherUrl.searchParams.set('longitude', String(longitude))
    weatherUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m')
    weatherUrl.searchParams.set('timezone', 'Europe/Paris')

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
    }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({ error: 'Météo indisponible' }, { status: 502 })
  }
}
