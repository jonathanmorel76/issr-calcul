'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AvatarKind = 'teacher_male' | 'teacher_female' | 'photo'

export type UserProfile = {
  user_id: string
  display_name: string | null
  birth_date: string | null
  teaching_start_date: string | null
  avatar_kind: AvatarKind
  avatar_path: string | null
}

export function ageFromBirthDate(value: string | null | undefined) {
  if (!value) return null
  const birth = new Date(`${value}T12:00:00`)
  const now = new Date()
  if (Number.isNaN(birth.getTime())) return null
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? age : null
}

export function isBirthday(value: string | null | undefined) {
  if (!value) return false
  const birth = new Date(`${value}T12:00:00`)
  const now = new Date()
  return birth.getMonth() === now.getMonth() && birth.getDate() === now.getDate()
}

export function ProfileAvatar({ kind, photoUrl, size = 'md', className = '' }: { kind?: AvatarKind | null; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const resolved = kind ?? 'teacher_male'
  if (resolved === 'photo' && photoUrl) {
    return <span className={`profile-avatar profile-avatar-${size} ${className}`.trim()}><img src={photoUrl} alt="Photo de profil" /></span>
  }
  return <span className={`profile-avatar profile-avatar-${size} profile-avatar-illustrated ${className}`.trim()} aria-label={resolved === 'teacher_female' ? 'Avatar enseignante' : 'Avatar enseignant'}>{resolved === 'teacher_female' ? '👩‍🏫' : '👨‍🏫'}</span>
}

export function useUserProfile() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    const id = authData.user?.id ?? null
    setUserId(id)
    if (!id) {
      setProfile(null)
      setLoading(false)
      return
    }
    const { data } = await supabase.from('issr_profiles').select('user_id,display_name,birth_date,teaching_start_date,avatar_kind,avatar_path').eq('user_id', id).maybeSingle()
    setProfile((data as UserProfile | null) ?? { user_id: id, display_name: null, birth_date: null, teaching_start_date: null, avatar_kind: 'teacher_male', avatar_path: null })
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<UserProfile>).detail
      if (detail) setProfile(detail)
    }
    window.addEventListener('mr-profile-updated', handler)
    return () => window.removeEventListener('mr-profile-updated', handler)
  }, [])

  const avatarUrl = useMemo(() => {
    if (!profile?.avatar_path || profile.avatar_kind !== 'photo') return null
    return supabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl
  }, [profile?.avatar_kind, profile?.avatar_path, supabase])

  return { profile, setProfile, userId, loading, avatarUrl, reload: load }
}
