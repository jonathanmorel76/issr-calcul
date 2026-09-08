import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RegularizationDossierView from '@/components/regularization-dossier-view'

export default async function RegularizationPage({searchParams}:{searchParams:Promise<{month?:string}>}){
 const params=await searchParams
 const month=params.month??new Date().toISOString().slice(0,7)
 if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))redirect('/dashboard/versements')
 const supabase=await createClient()
 const {data}=await supabase.auth.getClaims()
 const userId=data?.claims?.sub as string|undefined
 if(!userId)redirect('/login')
 const start=`${month}-01`
 const endDate=new Date(`${month}-01T12:00:00`);endDate.setMonth(endDate.getMonth()+1)
 const end=endDate.toISOString().slice(0,10)
 const [{data:entries},{data:payments},{data:documents}]=await Promise.all([
  supabase.from('issr_entries').select('travel_date,destination,distance_km,total_amount,rate_code').gte('travel_date',start).lt('travel_date',end).order('travel_date'),
  supabase.from('issr_payments').select('payment_month,entitlement_month,received_amount,note,source_document_id').gte('entitlement_month',start).lt('entitlement_month',end).order('payment_month'),
  supabase.from('issr_documents').select('id,title,file_name,created_at').eq('category','fiche_paie').order('created_at',{ascending:false})
 ])
 return <RegularizationDossierView month={month} entries={(entries??[]) as any} payments={(payments??[]) as any} documents={(documents??[]) as any}/>
}
