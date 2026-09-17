import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/account";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/account";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      if (userId) {
        const metadata = data.claims.user_metadata as { display_name?: string } | undefined;
        const fallbackName = String(data.claims.email ?? "Learner").split("@")[0];
        await supabase.from("profiles").upsert({
          user_id: userId,
          display_name: (metadata?.display_name || fallbackName).slice(0, 80),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id", ignoreDuplicates: true });
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth?message=Unable%20to%20confirm%20this%20email%20link.", request.url));
}
