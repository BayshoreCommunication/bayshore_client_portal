import { getMyOnboardingAction, listMyOnboardingCommentsAction } from "@/app/actions/onboarding";
import KickoffCallCard from "@/component/client-onboarding/KickoffCallCard";
import OnboardingProcess from "@/component/client-onboarding/OnboardingProcess";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Client onboarding – BayShore" };

// The onboarding form, for the client who is signed in — a page of the portal like any
// other, inside its sidebar and top bar. It opens filled in with what we hold on them (their
// name, company, email, phone and any answers given before), and saves onto their own record.
// Over it, the way to book the onboarding call; `?book=1` (the onboarding emails' link) opens it.
const OnboardingPage = async ({ searchParams }: { searchParams: Promise<{ book?: string | string[]; step?: string | string[]; item?: string | string[] }> }) => {
  const [mine, comments] = await Promise.all([getMyOnboardingAction(), listMyOnboardingCommentsAction()]);
  const { book, step, item } = await searchParams;
  // A notification about a comment opens the form at its step and item (?step=social&item=social.facebook).
  const one = (value?: string | string[]) => (typeof value === "string" ? value : undefined);

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

  const onboarding = mine.data.onboarding;
  return (
    <>
      <KickoffCallCard booked={onboarding?.kickoffCall?.booked === true} formDone={onboarding?.status === "submitted"} open={book === "1"} />
      {/* Comments that couldn't be loaded leave the comments box off, rather than showing none. */}
      <OnboardingProcess initial={mine.data} mine comments={comments.ok ? comments.data : undefined} focus={{ step: one(step), item: one(item) }} />
    </>
  );
};

export default OnboardingPage;
