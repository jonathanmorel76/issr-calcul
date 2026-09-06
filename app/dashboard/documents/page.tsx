import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DocumentsView from '@/components/documents-view'
import SecondaryViewShell from '@/components/secondary-view-shell'

export default async function DocumentsPage(){
 const supabase=await createClient()
 const {data}=await supabase.auth.getClaims()
 const userId=data?.claims?.sub as string|undefined
 if(!userId)redirect('/login')
 return <SecondaryViewShell active="documents" title="Mes documents" description="Centralisez vos arrêtés, attestations, emplois du temps et justificatifs dans un espace privé accessible depuis vos remplacements."><DocumentsView userId={userId}/></SecondaryViewShell>
}
