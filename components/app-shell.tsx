'use client'

import { useMemo, useState } from 'react'
import IssrApp from '@/components/issr-app'

type EntrySummary={travel_date:string;distance_km:number;total_amount:number;rep_bonus:number;rep_plus_bonus:number}
type Mission={id:string;title:string|null;start_date:string;end_date:string;status:string;issr_establishments:{name:string}|null}

type Props={userId:string;initialEntries:EntrySummary[];initialMissions:Mission[]}

export default function AppShell({userId,initialEntries,initialMissions}:Props){
  const [view,setView]=useState<'dashboard'|'indemnities'>('dashboard')
  const month=new Date().toISOString().slice(0,7)
  const monthEntries=useMemo(()=>initialEntries.filter(e=>e.travel_date.startsWith(month)),[initialEntries,month])
  const stats=useMemo(()=>monthEntries.reduce((a,e)=>({days:a.days+1,km:a.km+Number(e.distance_km),total:a.total+Number(e.total_amount),rep:a.rep+Number(e.rep_bonus)+Number(e.rep_plus_bonus)}),{days:0,km:0,total:0,rep:0}),[monthEntries])
  const today=new Date().toISOString().slice(0,10)
  const nextMission=initialMissions.filter(m=>m.end_date>=today&&m.status!=='cancelled').sort((a,b)=>a.start_date.localeCompare(b.start_date))[0]

  if(view==='indemnities') return <><div className="product-nav"><button onClick={()=>setView('dashboard')}>← Tableau de bord</button><strong>Mon Remplacement</strong></div><IssrApp userId={userId}/></>

  return <div className="product-shell">
    <header className="product-hero"><div><span className="product-kicker">Mon Remplacement</span><h1>Bonjour 👋</h1><p>Voici l’essentiel de votre activité pour ce mois.</p></div><button className="btn btn-primary" onClick={()=>setView('indemnities')}>+ Ajouter un déplacement</button></header>
    <nav className="product-tabs"><button className="active">Tableau de bord</button><button disabled>Mes missions</button><button onClick={()=>setView('indemnities')}>Mes indemnités</button><button disabled>Mes établissements</button><button disabled>Mes bilans</button></nav>
    <main className="dashboard-main">
      <section className="dashboard-stats">
        <article><span>Jours déclarés</span><strong>{stats.days}</strong><small>ce mois</small></article>
        <article><span>ISSR estimées</span><strong>{stats.total.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</strong><small>indemnités + primes</small></article>
        <article><span>Distance</span><strong>{stats.km.toLocaleString('fr-FR',{maximumFractionDigits:1})} km</strong><small>trajets enregistrés</small></article>
        <article><span>REP / REP+</span><strong>{stats.rep.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</strong><small>primes estimées</small></article>
      </section>
      <section className="dashboard-grid">
        <article className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">À venir</span><h2>Prochaine mission</h2></div><span className="status-chip">Planning</span></div>{nextMission?<div className="next-mission"><strong>{nextMission.issr_establishments?.name??nextMission.title??'Mission'}</strong><span>Du {new Date(nextMission.start_date+'T12:00:00').toLocaleDateString('fr-FR')} au {new Date(nextMission.end_date+'T12:00:00').toLocaleDateString('fr-FR')}</span></div>:<div className="empty-state"><strong>Aucune mission planifiée</strong><p>La prochaine étape permettra d’enregistrer un remplacement sur une période et de générer automatiquement les journées.</p></div>}</article>
        <article className="dashboard-panel quick-panel"><div><span className="eyebrow">Accès rapide</span><h2>Que souhaitez-vous faire ?</h2></div><button onClick={()=>setView('indemnities')}><span>€</span><div><strong>Mes indemnités</strong><small>Calculer ou consulter les ISSR</small></div><b>→</b></button><button disabled><span>🏫</span><div><strong>Ajouter un établissement</strong><small>Bientôt disponible</small></div><b>→</b></button><button disabled><span>📅</span><div><strong>Créer une mission</strong><small>Bientôt disponible</small></div><b>→</b></button></article>
      </section>
      <section className="dashboard-panel dashboard-info"><div><span className="eyebrow">Automatisation</span><h2>Le calcul ISSR reste à jour</h2><p>Les barèmes officiels synchronisés avec Légifrance continuent d’alimenter le calculateur. Les futures missions réutiliseront automatiquement ces règles.</p></div><button className="btn btn-export" onClick={()=>setView('indemnities')}>Ouvrir le calculateur</button></section>
    </main>
  </div>
}
