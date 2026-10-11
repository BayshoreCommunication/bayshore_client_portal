import { getMyOnboardingAction } from "@/app/actions/onboarding";
import OnboardingProcess from "@/component/client-onboarding/OnboardingProcess";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Client onboarding – BayShore" };

// The onboarding form, for the client who is signed in — a page of the portal like any
// other, inside its sidebar and top bar. It opens filled in with what we hold on them (their
// name, company, email, phone and any answers given before), and saves onto their own record.
const OnboardingPage = async () => {
  const mine = await getMyOnboardingAction();

  if (!mine.ok || !mine.data) {
    return (
      <div
        className="rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b42318]"
        role="alert"
      >
        {mine.error ?? "Couldn't load your onboarding."}
      </div>
    );
  }

  return <OnboardingProcess initial={mine.data} mine />;
};

export default OnboardingPage;
