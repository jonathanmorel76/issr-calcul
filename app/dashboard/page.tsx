import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IssrApp from '@/components/issr-app'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub as string | undefined
  if (!userId) redirect('/login')
  return <IssrApp userId={userId} />
}
