'use client'

import BilansView from '@/components/bilans-view'
import ProRouteGate from '@/components/pro-route-gate'

export default function BilansAccessView({userId}:{userId:string}){
 return <ProRouteGate><BilansView userId={userId}/></ProRouteGate>
}
