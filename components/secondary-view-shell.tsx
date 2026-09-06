import BrandLogo from '@/components/brand-logo'

export default function SecondaryViewShell({active,title,description,children}:{active:'bilans'|'documents';title:string;description:string;children:React.ReactNode}){
 const tabs=[['dashboard','Tableau de bord','/dashboard'],['establishments','Mes établissements','/dashboard?view=establishments'],['missions','Mes missions','/dashboard?view=missions'],['indemnities','Mes indemnités','/dashboard?view=indemnities'],['bilans','Mes bilans','/dashboard/bilans'],['documents','Mes documents','/dashboard/documents']] as const
 return <div className="product-shell"><header className="product-hero"><div className="product-hero-copy"><BrandLogo inverse/><div className="product-hero-text"><h1>{title}</h1><p>{description}</p></div></div></header><nav className="product-tabs">{tabs.map(([id,label,href])=><a key={id} href={href} className={active===id?'active':''}>{label}</a>)}</nav>{children}</div>
}
