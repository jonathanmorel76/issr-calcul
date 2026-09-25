'use client'

import PaymentsView from '@/components/payments-view'
import ProRouteGate from '@/components/pro-route-gate'

export default function PaymentsAccessView({userId}:{userId:string}){
 return <ProRouteGate><PaymentsView userId={userId}/></ProRouteGate>
}
