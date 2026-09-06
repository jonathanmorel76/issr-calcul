type BrandLogoProps = {
  compact?: boolean
  inverse?: boolean
  className?: string
}

export default function BrandLogo({ compact = false, inverse = false, className = '' }: BrandLogoProps) {
  const ink = inverse ? '#ffffff' : '#164f55'
  return <div className={`brand-logo ${compact ? 'brand-logo-compact' : ''} ${inverse ? 'brand-logo-inverse' : ''} ${className}`.trim()} aria-label="Mon Remplacement">
    <svg className="brand-mark" viewBox="0 0 72 72" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <path d="M17 52V23L36 40L55 23V52" fill="none" stroke={ink} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 17.5c0-4.8 3.8-8.5 8.5-8.5s8.5 3.7 8.5 8.5c0 6.6-8.5 14.4-8.5 14.4s-8.5-7.8-8.5-14.4Z" fill="#69a75b"/>
      <circle cx="22" cy="17.3" r="3.1" fill="#fff"/>
      <path d="M42.5 49.5C47 44.2 51 40 56.5 35" fill="none" stroke="#ef8a3a" strokeWidth="3" strokeLinecap="round" strokeDasharray="1.5 5.5"/>
      <rect x="52" y="25.5" width="12" height="13" rx="2" fill="#ef8a3a"/>
      <path d="M55 25.5v-4.5h6v4.5M56 38.5v-6h4v6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    {!compact && <div className="brand-copy"><strong>Mon Remplacement</strong><span>L’assistant des enseignants remplaçants</span></div>}
  </div>
}
