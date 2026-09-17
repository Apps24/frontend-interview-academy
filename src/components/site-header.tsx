import Link from "next/link";

export function SiteHeader() {
  return <header className="site-header page-width"><Link href="/" className="brand" aria-label="FrontendPrep home"><span className="brand-mark">F</span><span>Frontend<strong>Prep</strong></span></Link><nav aria-label="Main navigation"><Link href="/#learn">Learn</Link><Link href="/#interview">Interview prep</Link><Link href="/#sprint">2-day sprint</Link><Link href="/#pricing">Pricing</Link></nav><div className="header-actions"><button type="button" className="text-button">Sign in</button><Link href="/learn/javascript/variables-and-types" className="button button-small">Start free</Link></div></header>;
}
