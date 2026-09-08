import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PaymentsAccessView from '@/components/payments-access-view'
import SecondaryViewShell from '@/components/secondary-view-shell'

export default async function PayrollPage(){
 const supabase=await createClient()
 const {data}=await supabase.auth.getClaims()
 const userId=data?.claims?.sub as string|undefined
 if(!userId)redirect('/login')
 return <SecondaryViewShell active="versements" title="Paie & versements" description="La fonctionnalité phare de Mon Remplacement : comparez vos droits ISSR à votre paie, repérez les écarts et préparez une régularisation si nécessaire."><PaymentsAccessView userId={userId}/></SecondaryViewShell>
}
