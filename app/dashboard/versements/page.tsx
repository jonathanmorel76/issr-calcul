import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PaymentsAccessView from '@/components/payments-access-view'
import SecondaryViewShell from '@/components/secondary-view-shell'

export default async function PaymentsPage(){
 const supabase=await createClient()
 const {data}=await supabase.auth.getClaims()
 const userId=data?.claims?.sub as string|undefined
 if(!userId)redirect('/login')
 return <SecondaryViewShell active="versements" title="Mes versements" description="Comparez vos indemnités estimées aux montants réellement versés et repérez rapidement les écarts à vérifier."><PaymentsAccessView userId={userId}/></SecondaryViewShell>
}
