'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import AppIcon from '@/components/app-icon'
import { createClient } from '@/lib/supabase/client'
import { scheduleForDate, type IssrRateSchedule } from '@/lib/issr'
import { ProfileAvatar, ageFromBirthDate, isBirthday, type AvatarKind, type UserProfile, useUserProfile } from '@/components/user-profile'

type MenuView='home'|'rates'|'sources'|'method'|'account'
function fmtDate(value:string|null){if(!value)return 'sans date de fin';return new Date(value+'T12:00:00').toLocaleDateString('fr-FR')}
function fmtEuro(value:number|string){return Number(value).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}
function fmtProfileDate(value:string|null|undefined){if(!value)return null;const date=new Date(`${value}T12:00:00`);return Number.isNaN(date.getTime())?null:date.toLocaleDateString('fr-FR')}

export default function AppUtilityMenu(){
 const pathname=usePathname(),supabase=useMemo(()=>createClient(),[])
 const {profile,userId,avatarUrl}=useUserProfile()
 const [open,setOpen]=useState(false),[view,setView]=useState<MenuView>('home'),[schedules,setSchedules]=useState<IssrRateSchedule[]>([])
 const [email,setEmail]=useState(''),[newEmail,setNewEmail]=useState(''),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState('')
 const [displayName,setDisplayName]=useState(''),[birthDate,setBirthDate]=useState(''),[teachingStartDate,setTeachingStartDate]=useState(''),[avatarKind,setAvatarKind]=useState<AvatarKind>('teacher_male'),[photoFile,setPhotoFile]=useState<File|null>(null)
 const [accountMessage,setAccountMessage]=useState(''),[busy,setBusy]=useState(false)

 useEffect(()=>{if(!pathname?.startsWith('/dashboard'))return;supabase.from('issr_rate_schedules').select('*').eq('is_official',true).order('valid_from',{ascending:false}).then(({data})=>setSchedules((data??[]) as IssrRateSchedule[]));supabase.auth.getUser().then(({data})=>{const value=data.user?.email??'';setEmail(value);setNewEmail(value)})},[pathname,supabase])
 useEffect(()=>{if(profile){setDisplayName(profile.display_name??'');setBirthDate(profile.birth_date??'');setTeachingStartDate(profile.teaching_start_date??'');setAvatarKind(profile.avatar_kind??'teacher_male')}},[profile])
 useEffect(()=>{if(!open){setView('home');setAccountMessage('');setPhotoFile(null)}},[open])
 if(!pathname?.startsWith('/dashboard'))return null

 const today=new Date().toISOString().slice(0,10),active=scheduleForDate(schedules,today)??schedules[0]??null
 const age=ageFromBirthDate(birthDate||null)
 const teachingDateLabel=fmtProfileDate(teachingStartDate)
 function navigate(next:MenuView){setView(next);setAccountMessage('')}
 async function changeEmail(){const value=newEmail.trim();if(!value||value===email){setAccountMessage('Saisissez une nouvelle adresse e-mail.');return}setBusy(true);setAccountMessage('');const {error}=await supabase.auth.updateUser({email:value});setBusy(false);setAccountMessage(error?error.message:'Demande enregistrée. Consultez vos e-mails pour confirmer le changement d’adresse.')}
 async function changePassword(){if(password.length<8){setAccountMessage('Le nouveau mot de passe doit contenir au moins 8 caractères.');return}if(password!==confirmPassword){setAccountMessage('Les deux mots de passe ne correspondent pas.');return}setBusy(true);setAccountMessage('');const {error}=await supabase.auth.updateUser({password});setBusy(false);if(error)setAccountMessage(error.message);else{setPassword('');setConfirmPassword('');setAccountMessage('Mot de passe mis à jour.')}}
 async function saveProfile(){
  if(!userId){setAccountMessage('Session utilisateur indisponible.');return}
  if(displayName.trim().length>40){setAccountMessage('Le prénom ou pseudo doit contenir 40 caractères maximum.');return}
  if(birthDate&&birthDate>today){setAccountMessage('La date de naissance ne peut pas être dans le futur.');return}
  if(teachingStartDate&&teachingStartDate>today){setAccountMessage('La date de début d’enseignement ne peut pas être dans le futur.');return}
  if(photoFile&&(photoFile.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(photoFile.type))){setAccountMessage('La photo doit être un JPG, PNG ou WebP de 5 Mo maximum.');return}
  if(avatarKind==='photo'&&!photoFile&&!profile?.avatar_path){setAccountMessage('Choisissez une photo avant de sélectionner l’option photo.');return}
  setBusy(true);setAccountMessage('')
  try{
   let avatarPath=profile?.avatar_path??null
   if(photoFile){
    const ext=photoFile.type==='image/png'?'png':photoFile.type==='image/webp'?'webp':'jpg'
    const nextPath=`${userId}/avatar-${Date.now()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('avatars').upload(nextPath,photoFile,{contentType:photoFile.type,upsert:false,cacheControl:'3600'})
    if(uploadError)throw uploadError
    if(profile?.avatar_path&&profile.avatar_path!==nextPath)await supabase.storage.from('avatars').remove([profile.avatar_path])
    avatarPath=nextPath
    setAvatarKind('photo')
   }else if(avatarKind!=='photo'&&profile?.avatar_path){
    await supabase.storage.from('avatars').remove([profile.avatar_path])
    avatarPath=null
   }
   const row:UserProfile={user_id:userId,display_name:displayName.trim()||null,birth_date:birthDate||null,teaching_start_date:teachingStartDate||null,avatar_kind:photoFile?'photo':avatarKind,avatar_path:avatarPath}
   const {data,error}=await supabase.from('issr_profiles').upsert(row,{onConflict:'user_id'}).select('user_id,display_name,birth_date,teaching_start_date,avatar_kind,avatar_path').single()
   if(error)throw error
   const saved=data as UserProfile
   setPhotoFile(null)
   window.dispatchEvent(new CustomEvent('mr-profile-updated',{detail:saved}))
   setAccountMessage('Profil enregistré. Les vues de l’app sont maintenant personnalisées.')
  }catch(error:any){setAccountMessage(error?.message||'Impossible d’enregistrer le profil.')}finally{setBusy(false)}
 }
 async function signOut(){setBusy(true);await supabase.auth.signOut({scope:'local'});window.location.href='/login'}

 return <><button className="app-burger" aria-label="Ouvrir le menu" aria-expanded={open} onClick={()=>setOpen(true)}><AppIcon name="menu" size={23}/></button>{open&&<div className="app-menu-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><aside className="app-menu-drawer" role="dialog" aria-modal="true" aria-label="Menu Mon Remplacement"><div className="app-menu-head"><div><strong>{view==='home'?'Menu':view==='rates'?'Grille tarifaire':view==='sources'?'Sources officielles':view==='method'?'Méthode de calcul':'Mon compte'}</strong><small>Mon Remplacement</small></div><button className="app-menu-close" onClick={()=>setOpen(false)} aria-label="Fermer"><AppIcon name="close" size={20}/></button></div>{view!=='home'&&<button className="app-menu-back" onClick={()=>navigate('home')}><AppIcon name="arrow-left" size={17}/> Retour au menu</button>}
 {view==='home'&&<div className="app-menu-home"><section><span className="app-menu-section-label">Références</span><button onClick={()=>navigate('rates')}><span className="menu-app-icon"><AppIcon name="rates" size={21}/></span><div><strong>Grille tarifaire ISSR</strong><small>Barème actuellement appliqué et tranches kilométriques</small></div><b><AppIcon name="arrow-right" size={16}/></b></button><button onClick={()=>navigate('sources')}><span className="menu-app-icon"><AppIcon name="sources" size={21}/></span><div><strong>Sources officielles</strong><small>Textes, références et date de vérification</small></div><b><AppIcon name="arrow-right" size={16}/></b></button><button onClick={()=>navigate('method')}><span className="menu-app-icon"><AppIcon name="calculator" size={21}/></span><div><strong>Méthode de calcul</strong><small>Comprendre distance, ISSR et primes</small></div><b><AppIcon name="arrow-right" size={16}/></b></button></section><section><span className="app-menu-section-label">Compte</span><button onClick={()=>navigate('account')}><span className="menu-app-icon"><AppIcon name="account" size={21}/></span><div><strong>Mon compte</strong><small>Profil, avatar, parcours et sécurité</small></div><b><AppIcon name="arrow-right" size={16}/></b></button></section></div>}
 {view==='rates'&&<div className="app-menu-content">{active?<><div className="reference-highlight"><span>Barème en vigueur</span><strong>{active.title||active.code}</strong><small>Valable du {fmtDate(active.valid_from)} au {fmtDate(active.valid_to)}</small></div><div className="rate-grid">{(active.brackets??[]).map((bracket,index)=><div key={`${bracket.min}-${index}`}><span>{Number(bracket.min)} à {Number(bracket.max)} km</span><strong>{fmtEuro(bracket.amount)}</strong></div>)}</div><div className="reference-note"><strong>Au-delà de la dernière tranche</strong><span>Majoration de {fmtEuro(active.extra_20km)} par tranche supplémentaire de 20 km, selon le barème enregistré.</span></div></>:<div className="reference-empty">Aucun barème officiel n’est actuellement disponible.</div>}</div>}
 {view==='sources'&&<div className="app-menu-content">{schedules.length?schedules.map(schedule=><article className="source-card" key={schedule.id}><div><span className="source-status">{schedule.is_official?'Officiel':'Information'}</span><strong>{schedule.title||schedule.code}</strong></div><dl><div><dt>Période</dt><dd>{fmtDate(schedule.valid_from)} → {fmtDate(schedule.valid_to)}</dd></div>{schedule.source_nor&&<div><dt>NOR</dt><dd>{schedule.source_nor}</dd></div>}{schedule.published_at&&<div><dt>Publication</dt><dd>{new Date(schedule.published_at).toLocaleDateString('fr-FR')}</dd></div>}<div><dt>Vérifié</dt><dd>{new Date(schedule.verified_at).toLocaleDateString('fr-FR')}</dd></div></dl>{schedule.source_url&&<a href={schedule.source_url} target="_blank" rel="noreferrer">Consulter le texte officiel</a>}</article>):<div className="reference-empty">Aucune source enregistrée.</div>}</div>}
 {view==='method'&&<div className="app-menu-content method-list"><article><span>1</span><div><strong>Distance de référence</strong><p>L’app calcule un itinéraire routier entre votre adresse habituelle et l’établissement de remplacement. La distance reste modifiable pour reprendre une valeur administrative de référence.</p></div></article><article><span>2</span><div><strong>Tranche ISSR</strong><p>La distance retenue est associée à la tranche du barème officiel valable à la date de la journée travaillée.</p></div></article><article><span>3</span><div><strong>Primes REP / REP+</strong><p>Lorsqu’un établissement est identifié REP ou REP+, la prime journalière correspondante est ajoutée à l’estimation.</p></div></article><article><span>4</span><div><strong>Contrôle</strong><p>Les montants restent des estimations de suivi. Les données officielles de votre administration font foi en cas d’écart.</p></div></article></div>}
 {view==='account'&&<div className="app-menu-content account-view"><div className="account-identity"><span>Compte connecté</span><strong>{email||'Adresse e-mail indisponible'}</strong></div>
  <section className="account-profile-card"><h3>Mon profil</h3><div className="account-profile-preview"><ProfileAvatar kind={avatarKind} photoUrl={avatarKind==='photo'?avatarUrl:null} size="md"/><div><strong>{displayName.trim()||'Votre prénom ou pseudo'}</strong><small>{age!==null?`${age} ans`:'Âge non renseigné'}</small>{teachingDateLabel&&<small>Enseigne depuis le {teachingDateLabel}</small>}</div></div>{birthDate&&isBirthday(birthDate)&&<div className="birthday-account-note"><AppIcon name="birthday" size={16}/> C’est votre anniversaire aujourd’hui !</div>}<label>Prénom ou pseudo<input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={40} placeholder="Ex : Camille"/></label><label>Date de naissance<input type="date" max={today} value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>{age!==null&&<div className="profile-age-hint"><span>Âge calculé automatiquement</span><strong>{age} ans</strong></div>}<label>Date de début d’enseignement<input type="date" max={today} value={teachingStartDate} onChange={e=>setTeachingStartDate(e.target.value)}/><small>Utilisée uniquement pour personnaliser votre profil et rappeler votre ancienneté.</small></label><div><span className="app-menu-section-label">Avatar</span><div className="avatar-picker"><button type="button" className={`avatar-option ${avatarKind==='teacher_male'?'active':''}`} onClick={()=>{setAvatarKind('teacher_male');setPhotoFile(null)}}><span className="avatar-option-icon"><AppIcon name="teacher-male" size={28}/></span> Enseignant</button><button type="button" className={`avatar-option ${avatarKind==='teacher_female'?'active':''}`} onClick={()=>{setAvatarKind('teacher_female');setPhotoFile(null)}}><span className="avatar-option-icon"><AppIcon name="teacher-female" size={28}/></span> Enseignante</button></div></div><label className="profile-upload">Photo de profil<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0]??null;setPhotoFile(file);if(file)setAvatarKind('photo')}}/><small>{photoFile?photoFile.name:profile?.avatar_kind==='photo'&&profile.avatar_path?'Photo actuelle enregistrée':'JPG, PNG ou WebP · 5 Mo maximum'}</small></label><button className="btn btn-primary profile-account-save" disabled={busy} onClick={saveProfile}>{busy?'Enregistrement…':'Enregistrer mon profil'}</button></section>
  <section><h3>Adresse e-mail</h3><label>Nouvelle adresse<input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} autoComplete="email"/></label><button className="btn btn-primary" disabled={busy||!newEmail.trim()||newEmail.trim()===email} onClick={changeEmail}>Modifier mon adresse</button><small>Une confirmation par e-mail peut être demandée avant que le changement soit effectif.</small></section>
  <section><h3>Mot de passe</h3><label>Nouveau mot de passe<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="8 caractères minimum"/></label><label>Confirmer<input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password"/></label><button className="btn btn-primary" disabled={busy||!password} onClick={changePassword}>Changer mon mot de passe</button></section>{accountMessage&&<p className="account-message">{accountMessage}</p>}<section className="account-session"><h3>Session</h3><button className="btn account-signout" disabled={busy} onClick={signOut}>Se déconnecter de cet appareil</button></section></div>}
 </aside></div>}</>
}
