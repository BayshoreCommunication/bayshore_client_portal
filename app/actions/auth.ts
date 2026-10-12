"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

export type SignInState = { error?: string } | undefined;

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const identifier = formData.get("identifier");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password) {
    return { error: "Email/phone and password are required." };
  }

  try {
    await signIn("credentials", { identifier, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "backend-unreachable") {
      return { error: "Could not reach the server. Please try again in a moment." };
    }
    if (error instanceof CredentialsSignin && error.code === "account-not-active") {
      return { error: "Your account is not active. Please contact your account manager." };
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email/phone or password." };
    }
    throw error;
  }
}

// Signs a new client in at the end of the steps they go through after creating their account
// (component/clientstart/ClientSignup.tsx), and takes them to their onboarding form. Signing in
// ends in a redirect, so this only returns when it couldn't be done — with why.
export async function enterPortalAction(email: string, password: string): Promise<{ error: string }> {
  try {
    await signIn("credentials", { identifier: email, password, redirectTo: "/onboarding" });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "backend-unreachable") {
      return { error: "Could not reach the server. Please log in in a moment." };
    }
    if (error instanceof AuthError) return { error: "We couldn't sign you in automatically. Please log in." };
    throw error;
  }
  return { error: "We couldn't sign you in automatically. Please log in." };
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  // They agreed to the Terms and Privacy Policy on the form.
  termsAccepted: boolean;
}

// What the steps after signing up ask, as the backend keeps it with the client's onboarding
// answers (client.onboarding): whole sections, by name. Only the sections sent are saved.
export interface SignupAnswers {
  // The business's name, kept as the client's own company name.
  companyName?: string;
  answers: Record<string, unknown>;
}

// Saves answers from those steps onto the new client's record (backend: PATCH /onboarding/me).
// Nobody is signed in while the steps are gone through, so this signs in to the backend with
// the account just made — only for this save: the session it opens is closed again straight away.
export async function saveSignupAnswersAction(email: string, password: string, input: SignupAnswers): Promise<{ ok: boolean; error?: string }> {
  try {
    const login = await fetch(`${BACKEND_API_URL}/auth/client/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password }),
      cache: "no-store",
    });
    const session = await login.json().catch(() => null);
    const accessToken: unknown = session?.data?.accessToken;
    if (!login.ok || typeof accessToken !== "string") return { ok: false, error: typeof session?.message === "string" ? session.message : "Couldn't save your answers." };

    const response = await fetch(`${BACKEND_API_URL}/onboarding/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    const body = response.ok ? null : await response.json().catch(() => null);

    // Best-effort: the sign-in above was only for this save.
    if (typeof session?.data?.refreshToken === "string") {
      await fetch(`${BACKEND_API_URL}/auth/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.data.refreshToken }),
      }).catch(() => undefined);
    }

    if (response.ok) return { ok: true };
    const details = Array.isArray(body?.errors) ? (body.errors as string[]) : [];
    return { ok: false, error: [typeof body?.message === "string" ? body.message : "Couldn't save your answers.", ...details].join(" ") };
  } catch {
    return { ok: false, error: "Could not reach the server. Your answers aren't saved yet." };
  }
}

export type SignUpResult = { ok: true } | { ok: false; error: string; fieldErrors?: string[] };

// Creates a new client's own account (backend: POST /auth/client/signup). It doesn't sign them
// in or send them anywhere: the front page they signed up on carries on to its onboarding steps
// (component/clientstart/ClientSignup.tsx), and they log in themselves when those are done.
export async function signUpAction(input: SignUpInput): Promise<SignUpResult> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/client/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    if (response.ok) return { ok: true };

    const body = await response.json().catch(() => null);
    return {
      ok: false,
      error: typeof body?.message === "string" ? body.message : "Couldn't create your account. Please try again.",
      fieldErrors: Array.isArray(body?.errors) ? (body.errors as string[]) : undefined,
    };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again in a moment." };
  }
}

export async function signOutAction() {
  const session = await auth();

  if (session?.refreshToken) {
    // Best-effort: revoke the refresh token server-side so it can't be used
    // again even if it somehow leaked. Signing out proceeds regardless.
    try {
      await fetch(`${BACKEND_API_URL}/auth/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    } catch {
      // Backend unreachable — the Auth.js session is still cleared below,
      // and the refresh token will simply expire on its own later.
    }
  }

  await signOut({ redirectTo: "/sign-in" });
}
