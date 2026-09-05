import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app-shell'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub as string | undefined
  if (!userId) redirect('/login')

  const {data:entries} = await supabase
    .from('issr_entries')
    .select('travel_date,distance_km,total_amount,rep_bonus,rep_plus_bonus')
    .order('travel_date',{ascending:false})

  return <AppShell userId={userId} initialEntries={(entries??[]) as any} initialMissions={[]} />
}
