import type { Metadata } from "next";
import Link from "next/link";
import { getOnboardingAction } from "@/app/actions/onboarding";
import OnboardingProcess from "@/component/client-onboarding/OnboardingProcess";
import { poppins } from "@/component/shared/fonts";

export const metadata: Metadata = { title: "Client onboarding – BayShore" };

// The onboarding form. A public page (see PUBLIC_ROUTES in proxy.ts): a new client reaches
// it from "Start onboarding" on the front page, before they have an account. If this browser
// started an onboarding earlier, the form opens with those answers.
const OnboardingPage = async () => {
  const saved = await getOnboardingAction();

  // Their onboarding was here, but the team has taken the client on: it is no longer theirs to edit.
  if (saved.status === 409) {
    return (
      <div className={`${poppins.className} mx-auto max-w-140 rounded-2xl border border-[#e6e8eb] bg-white p-8 text-center shadow-[0_2px_6px_rgba(15,23,42,0.05)]`}>
        <h1 className="text-[22px] leading-tight font-bold text-[#0b0c24]">Your onboarding is with your BayShore team</h1>
        <p className="mt-2 text-[13px] leading-[1.6] text-[#6b7280]">
          We&apos;ve picked up your answers and started setting things up. To change something, ask your account manager — or sign in to your portal.
        </p>
        <Link href="/sign-in" className="mt-5 inline-flex rounded-lg bg-[#0b0c24] px-5 py-2.5 text-[13px] font-semibold text-white no-underline hover:bg-[#1e2140]">
          Sign in to your portal
        </Link>
      </div>
    );
  }

  return <OnboardingProcess initial={saved.data ?? null} />;
};

export default OnboardingPage;
