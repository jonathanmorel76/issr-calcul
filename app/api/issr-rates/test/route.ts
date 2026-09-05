import { NextResponse } from 'next/server'

const PISTE_OAUTH = 'https://oauth.piste.gouv.fr/api/oauth/token'

export async function GET() {
  const clientId = process.env.PISTE_CLIENT_ID
  const clientSecret = process.env.PISTE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ ok: false, message: 'Configuration PISTE absente.' }, { status: 503 })
  }

  try {
    const tokenResponse = await fetch(PISTE_OAUTH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid',
      }),
      cache: 'no-store',
    })

    if (!tokenResponse.ok) {
      return NextResponse.json({
        ok: false,
        stage: 'oauth',
        message: `Connexion PISTE refusée (HTTP ${tokenResponse.status}).`,
      }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      stage: 'oauth',
      message: 'Connexion OAuth PISTE réussie. Les identifiants sont valides.',
      tested_at: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ ok: false, stage: 'network', message: 'Impossible de joindre PISTE.' }, { status: 502 })
  }
}
