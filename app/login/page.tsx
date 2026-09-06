'use client'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/brand-logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMessage('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message); else window.location.href = '/dashboard'
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      setMessage(error ? error.message : 'Compte créé. Vérifie ton e-mail pour confirmer ton inscription.')
    }
    setLoading(false)
  }

  return <main className="auth-page">
    <section className="auth-board">
      <BrandLogo inverse />
      <p className="auth-intro">Missions, établissements, indemnités et documents : votre remplacement au même endroit.</p>
    </section>
    <section className="auth-card card">
      <span className="eyebrow">Espace personnel</span>
      <h2>{mode === 'login' ? 'Bienvenue' : 'Créer mon espace'}</h2>
      <p className="auth-subtitle">{mode === 'login' ? 'Connectez-vous pour retrouver votre activité.' : 'Créez votre espace pour commencer à organiser vos remplacements.'}</p>
      <form onSubmit={submit} className="auth-form">
        <label>E-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Mot de passe<input type="password" required minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Chargement…' : mode === 'login' ? 'Accéder à mon espace' : 'Créer mon espace'}</button>
      </form>
      {message && <p className="auth-message">{message}</p>}
      <button className="link-btn" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}}>{mode === 'login' ? 'Pas encore de compte ? Créer mon espace' : 'Déjà inscrit ? Se connecter'}</button>
    </section>
  </main>
}
