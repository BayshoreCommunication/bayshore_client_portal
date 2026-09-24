"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInAction, type SignInState } from "@/app/actions/auth";

const SigninForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-115 rounded-[14px] border border-[#e5e9e7] bg-white px-12 py-11 shadow-[0_1px_3px_rgba(13,30,44,0.06),0_10px_30px_rgba(13,30,44,0.06)]">
      <div className="font-serif text-2xl font-bold text-[#17242f]">Welcome back</div>
      <div className="mt-1 mb-7 text-[13px] text-[#657787]">Sign in to your BayShore client account.</div>

      <form action={action}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <label className="mb-1.25 block text-[11.5px] font-bold text-[#384b59]" htmlFor="identifier">
          Email
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 text-[#8496a3]">
            <Mail size={15} strokeWidth={2} />
          </span>
          <input
            id="identifier"
            className="w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] py-2.25 pr-3 pl-9 text-[12.5px] text-[#17242f]"
            type="email"
            name="identifier"
            placeholder="you@bayshore.com"
            autoComplete="username"
            required
          />
        </div>

        <label className="mt-4 mb-1.25 block text-[11.5px] font-bold text-[#384b59]" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 text-[#8496a3]">
            <Lock size={15} strokeWidth={2} />
          </span>
          <input
            id="password"
            className="w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] py-2.25 pr-8.5 pl-9 text-[12.5px] text-[#17242f]"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="absolute top-1/2 right-2 flex -translate-y-1/2 cursor-pointer border-none bg-transparent p-1 text-[#8496a3]"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
          </button>
        </div>

        {state?.error ? (
          <div className="mt-3.5 rounded-md bg-[#fbdada] px-3 py-2.25 text-[12.5px] font-medium text-[#b91c1c]">
            {state.error}
          </div>
        ) : null}

        <button
          className="mt-5 w-full cursor-pointer rounded-lg bg-[#0b1522] px-5 py-2.75 text-[13.5px] font-semibold text-white transition-colors duration-150 hover:bg-[#17242f] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default SigninForm;
