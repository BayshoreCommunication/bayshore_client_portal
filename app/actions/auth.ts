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

export interface SignUpInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export type SignUpResult = { ok: true } | { ok: false; error: string; fieldErrors?: string[] };

// Where a new client lands once their account is made: the onboarding steps, inside the portal.
const AFTER_SIGN_UP = "/get-started";

// Creates a new client's own account (backend: POST /auth/client/signup), signs them in with
// what they just chose, and sends them on to the onboarding steps. So it only ever comes back
// with a failure: a success leaves the page.
export async function signUpAction(input: SignUpInput): Promise<SignUpResult> {
  const created = await createAccount(input);
  if (!created.ok) return created;

  try {
    await signIn("credentials", { identifier: input.email, password: input.password, redirectTo: AFTER_SIGN_UP });
  } catch (error) {
    // The account is there; only signing in went wrong. (The redirect is thrown too, and passes through.)
    if (error instanceof AuthError) return { ok: false, error: "Your account was created, but we couldn't sign you in. Please log in." };
    throw error;
  }
  return { ok: true };
}

async function createAccount(input: SignUpInput): Promise<SignUpResult> {
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
