import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn, signUp } from "./actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

type AuthPageProps = {
  searchParams: Promise<{ mode?: string; message?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/account");

  const params = await searchParams;
  const isSignUp = params.mode === "signup";

  return <main className="auth-shell">
    <section className="auth-panel">
      <Link href="/" className="brand auth-brand"><span className="brand-mark">F</span><span>Frontend<strong>Prep</strong></span></Link>
      <span className="overline accent">{isSignUp ? "CREATE YOUR LEARNING ACCOUNT" : "WELCOME BACK"}</span>
      <h1>{isSignUp ? "Start building proof." : "Continue your progress."}</h1>
      <p>Your lesson progress, quiz attempts, and future interview plans stay synced to your account.</p>
      {params.message && <div className="auth-message" role="status">{params.message}</div>}
      <form className="auth-form">
        {isSignUp && <label>Full name<input name="displayName" type="text" autoComplete="name" maxLength={80} required /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required /></label>
        <button className="button button-primary" formAction={isSignUp ? signUp : signIn}>{isSignUp ? "Create free account" : "Sign in"}</button>
      </form>
      <p className="auth-switch">{isSignUp ? "Already have an account?" : "New to FrontendPrep?"} <Link href={isSignUp ? "/auth" : "/auth?mode=signup"}>{isSignUp ? "Sign in" : "Create one"}</Link></p>
      <Link href="/" className="back-link auth-back">← Back to the academy</Link>
    </section>
    <aside className="auth-aside"><span className="overline accent">ONE ACCOUNT, EVERY CHECKPOINT</span><h2>Practice that remembers where you stopped.</h2><ul><li>Resume lessons across devices</li><li>Keep every quiz attempt</li><li>See completion and accuracy together</li></ul></aside>
  </main>;
}
