import { NextRequest } from 'next/server'
import { GET as runSync } from '../sync/route'

export async function GET() {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return new Response('CRON_SECRET absent', { status: 503 })
  const req = new NextRequest('https://issr-calcul.vercel.app/api/issr-rates/sync', {
    headers: { authorization: `Bearer ${cronSecret}` },
  })
  return runSync(req)
}
