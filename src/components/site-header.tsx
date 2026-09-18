import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  return <header className="site-header page-width"><Link href="/" className="brand" aria-label="FrontendPrep home"><span className="brand-mark">F</span><span>Frontend<strong>Prep</strong></span></Link><nav aria-label="Main navigation"><Link href="/learn/javascript">Learn</Link><Link href="/interview">Interview prep</Link><Link href="/sprint">2-day sprint</Link><Link href="/#pricing">Pricing</Link></nav><div className="header-actions">{isAuthenticated ? <><Link href="/account" className="text-button">My progress</Link><form action={signOut}><button type="submit" className="button button-small header-signout">Sign out</button></form></> : <><Link href="/auth" className="text-button">Sign in</Link><Link href="/auth?mode=signup" className="button button-small">Start free</Link></>}</div></header>;
}
