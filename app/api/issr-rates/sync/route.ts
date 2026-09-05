import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const PISTE_OAUTH = 'https://oauth.piste.gouv.fr/api/oauth/token'
const PISTE_API = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app'
const ISSR_PHRASE = 'indemnité de sujétions spéciales de remplacement'
const PARSER_VERSION = 2
const JO_LOOKBACK = 12
const MAX_TEXTS_PER_RUN = 120

type Bracket = { min: number; max: number; amount: number }
type ParsedRate = {
  code: string
  title: string
  valid_from: string
  valid_to: string | null
  brackets: Bracket[]
  extra_20km: number
  source_url: string
  source_nor: string | null
  source_jorf: string | null
  source_text_id: string
  published_at: string | null
}

function collectIds(value: unknown, out = new Set<string>()) {
  if (typeof value === 'string' && /^JORF(?:TEXT|CONT)\d+$/.test(value)) out.add(value)
  else if (Array.isArray(value)) value.forEach((v) => collectIds(v, out))
  else if (value && typeof value === 'object') Object.values(value as Record<string, unknown>).forEach((v) => collectIds(v, out))
  return out
}

function normalizeText(value: unknown) {
  return JSON.stringify(value)
    .replace(/\\u00a0/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
}

function euroAfter(text: string, label: RegExp) {
  const m = text.match(new RegExp(`${label.source}[\\s\\S]{0,180}?(\\d{1,3}(?:[,.]\\d{1,2})?)\\s*€`, 'i'))
  return m ? Number(m[1].replace(',', '.')) : null
}

const MONTHS: Record<string, string> = {
  janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
  juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12',
}

function frenchDate(day: string, month: string, year: string) {
  const mm = MONTHS[month.toLowerCase()]
  return mm ? `${year}-${mm}-${day.padStart(2, '0')}` : null
}

function parsePublishedAt(text: string) {
  const m = text.match(/JORF\s*n[°º]?\s*\d+\s*du\s+(\d{1,2})(?:er)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i)
  return m ? frenchDate(m[1], m[2], m[3]) : null
}

function parseRate(textId: string, payload: unknown): ParsedRate | null {
  const text = normalizeText(payload)
  if (!text.toLowerCase().includes(ISSR_PHRASE)) return null

  const values = [
    euroAfter(text, /moins de 10 km/i),
    euroAfter(text, /de 10 à 19 km/i),
    euroAfter(text, /de 20 à 29 km/i),
    euroAfter(text, /de 30 à 39 km/i),
    euroAfter(text, /de 40 à 49 km/i),
    euroAfter(text, /de 50 à 59 km/i),
    euroAfter(text, /de 60 à 80 km/i),
    euroAfter(text, /tranche supplémentaire de 20 km/i),
  ]
  if (values.some((v) => v === null)) return null

  const temporary = text.match(/entre le\s+(\d{1,2})(?:er)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\s+et le\s+(\d{1,2})(?:er)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i)
  const permanent = text.match(/(?:à compter du|applicable(?:s)? à compter du|prend(?:ront)? effet le)\s+(\d{1,2})(?:er)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i)

  const validFrom = temporary
    ? frenchDate(temporary[1], temporary[2], temporary[3])
    : permanent
      ? frenchDate(permanent[1], permanent[2], permanent[3])
      : null
  const validTo = temporary ? frenchDate(temporary[4], temporary[5], temporary[6]) : null
  if (!validFrom) return null

  const nor = text.match(/NOR\s*:?\s*([A-Z0-9]+A)/i)?.[1] ?? null
  const jorf = text.match(/JORF\s*n[°º]?\s*([0-9]+)\s*du\s*([^\"]{5,40})/i)?.[0] ?? null
  const title = text.match(/Arrêté[^\"]{0,300}indemnité de sujétions spéciales de remplacement[^\"]{0,200}/i)?.[0] ?? 'Barème ISSR officiel'
  const a = values as number[]

  return {
    code: `ISSR-AUTO-${validFrom}-${textId}`,
    title,
    valid_from: validFrom,
    valid_to: validTo,
    brackets: [
      { min: 0, max: 9.999999, amount: a[0] },
      { min: 10, max: 19.999999, amount: a[1] },
      { min: 20, max: 29.999999, amount: a[2] },
      { min: 30, max: 39.999999, amount: a[3] },
      { min: 40, max: 49.999999, amount: a[4] },
      { min: 50, max: 59.999999, amount: a[5] },
      { min: 60, max: 80, amount: a[6] },
    ],
    extra_20km: a[7],
    source_url: `https://www.legifrance.gouv.fr/jorf/id/${textId}`,
    source_nor: nor,
    source_jorf: jorf,
    source_text_id: textId,
    published_at: parsePublishedAt(text),
  }
}

async function pistePost(token: string, path: string, body: unknown) {
  const r = await fetch(`${PISTE_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`PISTE ${path}: HTTP ${r.status}`)
  return r.json()
}

async function finishRun(
  supabase: SupabaseClient,
  runId: string,
  values: Record<string, unknown>,
) {
  await supabase.from('issr_sync_runs').update({ finished_at: new Date().toISOString(), ...values }).eq('id', runId)
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.PISTE_CLIENT_ID
  const clientSecret = process.env.PISTE_CLIENT_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!clientId || !clientSecret || !supabaseUrl || !secretKey) {
    return NextResponse.json({ ok: false, configured: false, message: 'Configuration serveur incomplète.' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: run, error: runError } = await supabase.from('issr_sync_runs').insert({ status: 'running' }).select('id').single()
  if (runError || !run) return NextResponse.json({ ok: false, error: 'Impossible de journaliser la synchronisation.' }, { status: 500 })

  try {
    const tokenResponse = await fetch(PISTE_OAUTH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: 'openid' }),
      cache: 'no-store',
    })
    if (!tokenResponse.ok) throw new Error(`OAuth PISTE HTTP ${tokenResponse.status}`)

    const tokenJson = await tokenResponse.json()
    const accessToken = tokenJson.access_token as string | undefined
    if (!accessToken) throw new Error('OAuth PISTE sans access_token')

    const lastJo = await pistePost(accessToken, '/consult/lastNJo', { nbElement: JO_LOOKBACK })
    const contIds = [...collectIds(lastJo)].filter((id) => id.startsWith('JORFCONT'))
    const textIds = new Set<string>()

    for (const id of contIds.slice(0, JO_LOOKBACK)) {
      const cont = await pistePost(accessToken, '/consult/jorfCont', { highlightActivated: false, id, pageNumber: 1, pageSize: 200 })
      collectIds(cont, textIds)
    }

    const orderedTextIds = [...textIds].filter((id) => id.startsWith('JORFTEXT')).sort().reverse()
    const { data: seenRows } = await supabase
      .from('issr_sync_seen_texts')
      .select('source_text_id,parser_version')
      .in('source_text_id', orderedTextIds.slice(0, 1000))

    const seen = new Map((seenRows ?? []).map((r) => [r.source_text_id as string, Number(r.parser_version)]))
    const toCheck = orderedTextIds.filter((id) => (seen.get(id) ?? 0) < PARSER_VERSION).slice(0, MAX_TEXTS_PER_RUN)

    const candidates: ParsedRate[] = []
    let checkedTexts = 0
    let documentErrors = 0

    for (const textId of toCheck) {
      try {
        const doc = await pistePost(accessToken, '/consult/jorf', { highlightActivated: false, id: textId, pageNumber: 1, pageSize: 100 })
        const parsed = parseRate(textId, doc)
        if (parsed) candidates.push(parsed)
        checkedTexts++
        await supabase.from('issr_sync_seen_texts').upsert({
          source_text_id: textId,
          parser_version: PARSER_VERSION,
          contains_issr: Boolean(parsed),
          checked_at: new Date().toISOString(),
        }, { onConflict: 'source_text_id' })
      } catch {
        documentErrors++
      }
    }

    let upserted = 0
    const upsertErrors: string[] = []
    for (const rate of candidates) {
      const { error } = await supabase.from('issr_rate_schedules').upsert({
        ...rate,
        source_name: 'Légifrance',
        verified_at: new Date().toISOString(),
        is_official: true,
      }, { onConflict: 'code' })
      if (error) upsertErrors.push(`${rate.source_text_id}: ${error.message}`)
      else upserted++
    }

    const details = {
      parser_version: PARSER_VERSION,
      available_texts: orderedTextIds.length,
      remaining_unseen: Math.max(0, orderedTextIds.length - (seen.size + checkedTexts)),
      document_errors: documentErrors,
      upsert_errors: upsertErrors,
      candidates: candidates.map((c) => ({ code: c.code, title: c.title, source_text_id: c.source_text_id, valid_from: c.valid_from, valid_to: c.valid_to })),
    }

    await finishRun(supabase, run.id, {
      status: upsertErrors.length ? 'error' : 'success',
      checked_jo: contIds.length,
      checked_texts: checkedTexts,
      candidates: candidates.length,
      upserted,
      error_message: upsertErrors.length ? upsertErrors.join(' | ').slice(0, 2000) : null,
      details,
    })

    return NextResponse.json({
      ok: upsertErrors.length === 0,
      configured: true,
      checked_jo: contIds.length,
      checked_texts: checkedTexts,
      candidates: candidates.length,
      upserted,
      remaining_unseen: details.remaining_unseen,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    await finishRun(supabase, run.id, { status: 'error', error_message: message.slice(0, 2000) })
    console.error('[ISSR sync]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
