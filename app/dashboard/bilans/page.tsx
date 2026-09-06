import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BilansView from '@/components/bilans-view'
import SecondaryViewShell from '@/components/secondary-view-shell'

export default async function BilansPage(){
 const supabase=await createClient()
 const {data}=await supabase.auth.getClaims()
 const userId=data?.claims?.sub as string|undefined
 if(!userId)redirect('/login')
 return <SecondaryViewShell active="bilans" title="Mes bilans" description="Analysez votre activité de remplacement sur l’année scolaire et exportez une synthèse prête à conserver ou à transmettre."><BilansView userId={userId}/></SecondaryViewShell>
}
