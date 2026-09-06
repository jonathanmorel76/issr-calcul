type BrandLogoProps = {
  compact?: boolean
  inverse?: boolean
  className?: string
}

export default function BrandLogo({ compact = false, inverse = false, className = '' }: BrandLogoProps) {
  const ink = inverse ? '#ffffff' : '#164f55'
  return <div className={`brand-logo ${compact ? 'brand-logo-compact' : ''} ${inverse ? 'brand-logo-inverse' : ''} ${className}`.trim()} aria-label="Mon Remplacement">
    <svg className="brand-mark" viewBox="0 0 72 72" role="img" aria-hidden="true">
      <path d="M17 52V22l19 18 19-18v30" fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 17c0-5 4-9 9-9s9 4 9 9c0 7-9 15-9 15s-9-8-9-15Z" fill="#69a75b"/>
      <circle cx="22" cy="17" r="3.3" fill="#fff"/>
      <path d="M44 51c7-9 12-14 17-18" fill="none" stroke="#ef8a3a" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6"/>
      <path d="M52 26h12v12H52z" fill="#ef8a3a" rx="2"/>
      <path d="M55 26v-5h6v5M56 38v-6h4v6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    {!compact && <div className="brand-copy"><strong>Mon Remplacement</strong><span>L’assistant des enseignants remplaçants</span></div>}
  </div>
}
