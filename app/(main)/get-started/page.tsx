import type { Metadata } from "next";
import { auth } from "@/auth";
import { ClientOnboarding } from "@/component/clientstart/ClientSignup";

export const metadata: Metadata = { title: "Get started – BayShore Client Portal" };

// The onboarding steps a new client is sent to right after making their account (see
// signUpAction). It is a page of the portal like any other: the sidebar and top bar around it
// come from the layout.
const GetStartedPage = async () => {
  const session = await auth();

  return <ClientOnboarding account={{ name: session?.user?.name ?? "", email: session?.user?.email ?? "" }} />;
};

export default GetStartedPage;
