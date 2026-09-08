type BrandLogoProps = {
  compact?: boolean
  inverse?: boolean
  className?: string
}

export default function BrandLogo({ compact = false, inverse = false, className = '' }: BrandLogoProps) {
  const copyColor = inverse ? '#ffffff' : '#164f55'

  return <div className={`brand-logo ${compact ? 'brand-logo-compact' : ''} ${inverse ? 'brand-logo-inverse' : ''} ${className}`.trim()} aria-label="Mon Remplacement">
    <svg className="brand-mark" viewBox="0 0 72 72" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <rect x="3" y="3" width="66" height="66" rx="18" fill={inverse ? '#f7f9f7' : '#ffffff'} />
      <rect x="10" y="13" width="52" height="48" rx="14" fill="#ffffff" stroke="#164f55" strokeOpacity=".12" />
      <path d="M10 27v-7c0-4.4 3.6-8 8-8h36c4.4 0 8 3.6 8 8v7H10Z" fill="#164f55" />
      <rect x="18" y="7" width="7" height="14" rx="3.5" fill="#103e43" stroke="#ffffff" strokeWidth="2.2" />
      <rect x="47" y="7" width="7" height="14" rx="3.5" fill="#103e43" stroke="#ffffff" strokeWidth="2.2" />
      <path d="M25 51V34l11 10 11-10v17" fill="none" stroke="#164f55" strokeWidth="6.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M47 51V40" fill="none" stroke="#ef8a3a" strokeWidth="6.1" strokeLinecap="round" />
      <path d="M20 49c-3.2-3.2-5-7.5-5-12.1 0-5.1 2.2-9.8 6-13.1" fill="none" stroke="#247078" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M18 24.2 25 22l-1.6 7.2" fill="#247078" />
      <path d="M52 23.7c3.5 3.1 5.6 7.5 5.6 12.2 0 5-2.2 9.5-5.9 12.7" fill="none" stroke="#ef8a3a" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M54.6 47.8 47.5 50l1.7-7.2" fill="#ef8a3a" />
      <rect x="26" y="55" width="5" height="2.8" rx="1.4" fill="#d9e3e3" />
      <rect x="33.5" y="55" width="5" height="2.8" rx="1.4" fill="#d9e3e3" />
      <rect x="41" y="55" width="5" height="2.8" rx="1.4" fill="#d9e3e3" />
    </svg>
    {!compact && <div className="brand-copy"><strong style={{ color: copyColor }}>Mon Remplacement</strong><span>L’assistant des enseignants remplaçants</span></div>}
  </div>
}
