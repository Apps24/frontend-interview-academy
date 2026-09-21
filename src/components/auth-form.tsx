"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { ScreenLoader } from "@/components/screen-loader";

type AuthFormProps = {
  isSignUp: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

function SubmitButton({ isSignUp }: { isSignUp: boolean }) {
  const { pending } = useFormStatus();
  return <>
    {pending && <ScreenLoader overlay label={isSignUp ? "Creating your account…" : "Signing you in…"} />}
    <button className="button button-primary" type="submit" disabled={pending} aria-disabled={pending}>{pending ? "Please wait…" : isSignUp ? "Create free account" : "Sign in"}</button>
  </>;
}

export function AuthForm({ isSignUp, action }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  return <form className="auth-form" action={action}>
    {isSignUp && <label>Full name<input name="displayName" type="text" autoComplete="name" maxLength={80} required /></label>}
    <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<span className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
      {showPassword ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 9 5 9 5s-1.2 1.6-3.2 3M6.6 6.6C4.3 8 3 10 3 10s3.8 5 9 5c1.2 0 2.3-.3 3.3-.7" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.8-5 9-5 9 5 9 5-3.8 5-9 5-9-5-9-5Z" /><circle cx="12" cy="12" r="2.5" /></svg>}
    </button></span></label>
    <SubmitButton isSignUp={isSignUp} />
  </form>;
}
