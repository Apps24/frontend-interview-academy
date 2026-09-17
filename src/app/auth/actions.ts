"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function authRedirect(message: string, mode: "signin" | "signup" = "signin"): never {
  redirect(`/auth?mode=${mode}&message=${encodeURIComponent(message)}`);
}

function readCredentials(formData: FormData, mode: "signin" | "signup" = "signin") {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !email.includes("@")) authRedirect("Enter a valid email address.", mode);
  if (password.length < 8) authRedirect("Password must be at least 8 characters.", mode);
  return { email, password };
}

async function ensureProfile(displayName?: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return;

  const fallbackName = String(data.claims.email ?? "Learner").split("@")[0];
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      display_name: (displayName || fallbackName).slice(0, 80),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (error) console.error("Unable to create the learner profile", error.message);
}

export async function signIn(formData: FormData) {
  const credentials = readCredentials(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) authRedirect(error.message);

  await ensureProfile();
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signUp(formData: FormData) {
  const { email, password } = readCredentials(formData, "signup");
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName || displayName.length > 80) authRedirect("Enter your name (maximum 80 characters).", "signup");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: { display_name: displayName },
    },
  });

  if (error) authRedirect(error.message, "signup");
  if (data.session) {
    await ensureProfile(displayName);
    revalidatePath("/", "layout");
    redirect("/account");
  }

  authRedirect("Check your email to confirm your account, then sign in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
