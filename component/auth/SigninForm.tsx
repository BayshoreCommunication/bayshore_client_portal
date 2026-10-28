"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction, type SignInState } from "@/app/actions/auth";
import { fraunces } from "@/component/shared/fonts";
import { ButtonArrow, suButtonClass, suFocusRing, suInputClass, suInputState } from "@/component/clientstart/WelcomeShell";

// The sign-in form, in the card of the front door's page (WelcomeShell, on /sign-in). The way
// here is "Log in" on the front page (/), or being sent from a page inside the portal that
// needs an account — which is where `callbackUrl` takes them back to.
const SigninForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, undefined);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // The button glows once both are typed in, as on creating an account.
  const ready = identifier.trim() !== "" && password !== "";

  return (
    <>
      <h2 className={`${fraunces.className} text-[23px] leading-[1.2] font-semibold text-[#0f2a3d]`}>Welcome back</h2>
      <p className="mt-1.5 mb-5.5 text-[14px] text-[#667280]">Log in to your BayShore client account.</p>

      <form action={action} className="grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="identifier" className="text-[13px] font-medium">
            Email
          </label>
          <input
            id="identifier"
            name="identifier"
            type="email"
            placeholder="you@yourfirm.com"
            autoComplete="username"
            required
            className={`${suInputClass} ${suInputState(false)}`}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              autoComplete="current-password"
              required
              className={`${suInputClass} ${suInputState(false)} pr-17.5`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
              className={`absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-lg bg-[#f4efe6] px-2.5 py-1.5 text-[12px] font-semibold text-[#0f2a3d] hover:bg-[#ebe3d4] ${suFocusRing}`}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {state?.error ? (
          <div role="alert" className="rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b42318]">
            {state.error}
          </div>
        ) : null}

        <button type="submit" disabled={pending} aria-busy={pending} className={`mt-1 ${suButtonClass(ready)}`}>
          {pending ? (
            "Logging in…"
          ) : (
            <>
              Log in
              <ButtonArrow />
            </>
          )}
        </button>

        <p className="text-center text-[14px] text-[#667280]">
          Not a client yet?{" "}
          <Link href="/" className={`border-b-2 border-[#d98b4a] pb-px font-semibold text-[#0f2a3d] no-underline ${suFocusRing}`}>
            Start growing your brand
          </Link>
        </p>

        <div className="flex justify-center text-[12px] text-[#667280]">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 018 0v3" />
            </svg>
            Secure &amp; encrypted
          </span>
        </div>
      </form>
    </>
  );
};

export default SigninForm;
