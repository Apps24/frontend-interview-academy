import type { Metadata } from "next";

import { DiagnosticAssessment } from "@/components/diagnostic-assessment";
import { SiteHeader } from "@/components/site-header";
import { publicDiagnosticQuestions } from "@/lib/diagnostic";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Frontend diagnostic assessment" };

export default async function DiagnosticPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { data: latest } = userId ? await supabase.from("diagnostic_attempts").select("total_correct, total_questions").eq("user_id", userId).order("completed_at", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const latestScore = latest ? Math.round(latest.total_correct / latest.total_questions * 100) : null;

  return <main className="app-shell diagnostic-page"><SiteHeader /><section className="diagnostic-hero page-width"><span className="eyebrow"><span className="status-dot" /> Adaptive starting point</span><h1>Know what you know.<br /><span>Fix what matters next.</span></h1><p>A short frontend diagnostic turns broad interview anxiety into a ranked study plan. Answer from memory—your first instinct is the useful signal.</p></section><div className="page-width diagnostic-wrap"><DiagnosticAssessment questions={publicDiagnosticQuestions} signedIn={Boolean(userId)} latestScore={latestScore} /></div></main>;
}
