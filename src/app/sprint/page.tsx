import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { SprintChecklist } from "@/components/sprint-checklist";
import { sprintItems, sprintTotalMinutes } from "@/lib/interview-sprint";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Two-day interview sprint", description: "A focused 48-hour frontend interview preparation plan." };

export default async function SprintPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { data: rows } = userId
    ? await supabase.from("sprint_item_progress").select("item_key").eq("user_id", userId)
    : { data: [] };

  return <main className="app-shell sprint-page">
    <SiteHeader />
    <section className="sprint-hero page-width"><div><span className="overline accent">INTERVIEW IN 48 HOURS?</span><h1>Your two-day<br />frontend sprint.</h1><p>Ten deliberate sessions. Start with recall and coding, then finish with explanation, debugging, and a realistic mock round.</p></div><aside><strong>{Math.floor(sprintTotalMinutes / 60)}h {sprintTotalMinutes % 60}m</strong><span>total focused time</span><small>Breaks are not included. Protect sleep; do not turn this into an all-nighter.</small></aside></section>
    <section className="sprint-plan page-width"><SprintChecklist items={sprintItems} initialCompleted={(rows ?? []).map(({ item_key }) => item_key)} isAuthenticated={Boolean(userId)} /></section>
  </main>;
}
